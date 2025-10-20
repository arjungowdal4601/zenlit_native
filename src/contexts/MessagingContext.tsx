import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import {
  ConversationUnreadCount,
  markConversationDelivered,
  markConversationRead,
  getUnreadCounts,
  type Message,
} from '../lib/database';
import type { AuthChangeEvent, Session, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type MessagingContextValue = {
  isReady: boolean;
  totalUnread: number;
  threadUnread: Record<string, number>;
  refreshUnread: () => Promise<void>;
  markThreadDelivered: (conversationId: string) => Promise<void>;
  markThreadRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  activeConversationId: string | null;
};

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
};

const mapCounts = (counts: ConversationUnreadCount[]): Record<string, number> => {
  const next: Record<string, number> = {};
  counts.forEach(({ conversation_id, unread_count }) => {
    next[conversation_id] = unread_count ?? 0;
  });
  return next;
};

export const MessagingProvider: React.FC<ProviderProps> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threadUnread, setThreadUnread] = useState<Record<string, number>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setCurrentUserId(data.user?.id ?? null);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setCurrentUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!currentUserId) {
      setThreadUnread({});
      setIsReady(true);
      return;
    }

    if (refreshPromiseRef.current) {
      await refreshPromiseRef.current;
      return;
    }

    const promise = (async () => {
      const { counts, error } = await getUnreadCounts();
      if (error) {
        console.error('Failed to load unread counts', error);
        setThreadUnread((prev) => prev);
      } else {
        setThreadUnread(mapCounts(counts));
      }
      setIsReady(true);
    })();

    refreshPromiseRef.current = promise;
    try {
      await promise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setThreadUnread({});
      setIsReady(true);
      return;
    }
    refreshUnread();
  }, [currentUserId, refreshUnread]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const channel = supabase
      .channel('messaging-unread-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message;
          if (!newMessage) {
            return;
          }

          if (newMessage.sender_id === currentUserId) {
            return;
          }

          if (activeConversationId && newMessage.conversation_id === activeConversationId) {
            // The conversation is open; mark delivered/read immediately.
            markConversationDelivered(newMessage.conversation_id)
              .catch((error) => {
                console.error('Failed to mark delivered for active conversation', error);
              })
              .finally(() => {
                markConversationRead(newMessage.conversation_id)
                  .catch((error) => {
                    console.error('Failed to mark conversation read for active thread', error);
                  })
                  .finally(() => {
                    setThreadUnread((prev) => {
                      if (!prev[newMessage.conversation_id]) {
                        return prev;
                      }
                      const next = { ...prev };
                      next[newMessage.conversation_id] = 0;
                      return next;
                    });
                  });
              });
            return;
          }

          markConversationDelivered(newMessage.conversation_id).catch((error) => {
            console.error('Failed to mark conversation delivered', error);
          });

          setThreadUnread((prev) => {
            const next = { ...prev };
            const nextValue = (next[newMessage.conversation_id] ?? 0) + 1;
            next[newMessage.conversation_id] = nextValue;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId]);

  const markThreadDelivered = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      return;
    }
    const { error } = await markConversationDelivered(conversationId);
    if (error) {
      console.error('Failed to mark conversation delivered', error);
    }
  }, []);

  const markThreadRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      const { error } = await markConversationRead(conversationId);
      if (error) {
        console.error('Failed to mark conversation read', error);
        return;
      }

      setThreadUnread((prev) => {
        if (!prev[conversationId]) {
          return prev;
        }
        return { ...prev, [conversationId]: 0 };
      });
    },
    []
  );

  const totalUnread = useMemo(
    () => Object.values(threadUnread).reduce((acc, value) => acc + value, 0),
    [threadUnread]
  );

  const value = useMemo<MessagingContextValue>(
    () => ({
      isReady,
      totalUnread,
      threadUnread,
      refreshUnread,
      markThreadDelivered,
      markThreadRead,
      activeConversationId,
      setActiveConversation: setActiveConversationId,
    }),
    [
      activeConversationId,
      isReady,
      markThreadDelivered,
      markThreadRead,
      refreshUnread,
      threadUnread,
      totalUnread,
    ]
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = (): MessagingContextValue => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
