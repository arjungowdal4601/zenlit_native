import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { UserUnreadCount } from '../lib/types';
import {
  markMessagesDelivered,
  markMessagesRead,
  getUnreadCounts,
} from '../services/messagingService';
import { getCurrentUser, isAuthReady, onAuthChange } from '../services/authService';
import { subscribeToUnreadMessageInserts } from '../utils/realtime';

type MessagingContextValue = {
  isReady: boolean;
  totalUnread: number;
  threadUnread: Record<string, number>;
  refreshUnread: () => Promise<void>;
  markThreadDelivered: (userId: string) => Promise<void>;
  markThreadRead: (userId: string) => Promise<void>;
  setActiveConversation: (userId: string | null) => void;
  activeConversationId: string | null;
};

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
};

const mapCounts = (counts: UserUnreadCount[]): Record<string, number> => {
  const next: Record<string, number> = {};
  counts.forEach(({ sender_id, unread_count }) => {
    next[sender_id] = unread_count ?? 0;
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
      if (!isAuthReady()) {
        setCurrentUserId(null);
        return;
      }
      const user = await getCurrentUser();
      if (mounted) {
        setCurrentUserId(user?.id ?? null);
      }
    })();

    const unsubscribeAuth = onAuthChange((_event, user) => {
      setCurrentUserId(user?.id ?? null);
    });

    return () => {
      mounted = false;
      unsubscribeAuth();
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
        if (error.message?.includes('404') || (error as any).code === 'PGRST204') {
          console.warn(
            '⚠️ Database migration required: The messaging tables or functions are not set up. ' +
            'Please apply the migration to enable messaging features.'
          );
        } else {
          console.error('Failed to load unread counts:', error);
        }
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

    return subscribeToUnreadMessageInserts(
      currentUserId,
      ({ new: newMessage }) => {
          if (!newMessage) {
            return;
          }

          if (activeConversationId && newMessage.sender_id === activeConversationId) {
            markMessagesDelivered(newMessage.sender_id)
              .catch((error) => {
                console.error('Failed to mark delivered for active conversation', error);
              })
              .finally(() => {
                markMessagesRead(newMessage.sender_id)
                  .catch((error) => {
                    console.error('Failed to mark messages read for active thread', error);
                  })
                  .finally(() => {
                    setThreadUnread((prev) => {
                      if (!prev[newMessage.sender_id]) {
                        return prev;
                      }
                      const next = { ...prev };
                      next[newMessage.sender_id] = 0;
                      return next;
                    });
                  });
              });
            return;
          }

          markMessagesDelivered(newMessage.sender_id).catch((error) => {
            console.error('Failed to mark messages delivered', error);
          });

          setThreadUnread((prev) => {
            const next = { ...prev };
            const nextValue = (next[newMessage.sender_id] ?? 0) + 1;
            next[newMessage.sender_id] = nextValue;
            return next;
          });
      },
    );
  }, [activeConversationId, currentUserId]);

  const markThreadDelivered = useCallback(async (userId: string) => {
    if (!userId) {
      return;
    }
    const { error } = await markMessagesDelivered(userId);
    if (error) {
      console.error('Failed to mark messages delivered', error);
    }
  }, []);

  const markThreadRead = useCallback(
    async (userId: string) => {
      if (!userId) {
        return;
      }

      const { error } = await markMessagesRead(userId);
      if (error) {
        console.error('Failed to mark messages read', error);
        return;
      }

      setThreadUnread((prev) => {
        if (!prev[userId]) {
          return prev;
        }
        return { ...prev, [userId]: 0 };
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
