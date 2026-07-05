import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { logger } from '../../src/utils/logger';
import { ActivityIndicator, AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import ChatList from '../../src/components/messaging/ChatList';
import type { Message, MessageThread } from '../../src/lib/types';
import { getUserMessageThreads } from '../../src/services/messagingService';
import { useVisibility } from '../../src/contexts/VisibilityContext';
import { getCurrentUser } from '../../src/services/authService';
import {
  subscribeToMessageListUpdates,
  subscribeToMessagePartnerLocationUpdates,
  type RealtimeChange,
  type RealtimeUnsubscribe,
} from '../../src/utils/realtime';
import { useMessaging } from '../../src/contexts/MessagingContext';
import { isUserNearby } from '../../src/services/locationDbService';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

type ThreadsState = {
  threads: MessageThread[];
  loading: boolean;
  initialLoadComplete: boolean;
};

type ThreadsAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_THREADS'; threads: MessageThread[] }
  | { type: 'UPSERT_THREAD'; thread: MessageThread }
  | { type: 'UPDATE_THREAD_MESSAGE'; otherUserId: string; message: Message }
  | { type: 'UPDATE_THREAD_ANONYMITY'; otherUserId: string; isAnonymous: boolean }
  | { type: 'INITIAL_LOAD_COMPLETE' }
  | { type: 'MERGE_NEW_THREADS'; threads: MessageThread[] };

function threadsReducer(state: ThreadsState, action: ThreadsAction): ThreadsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    case 'SET_THREADS':
      return {
        ...state,
        threads: action.threads,
        loading: false,
      };

    case 'INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: true, loading: false };

    case 'UPSERT_THREAD': {
      const existingIndex = state.threads.findIndex(
        (t) => t.other_user_id === action.thread.other_user_id
      );

      let newThreads: MessageThread[];
      if (existingIndex >= 0) {
        newThreads = [...state.threads];
        newThreads[existingIndex] = action.thread;
      } else {
        newThreads = [action.thread, ...state.threads];
      }

      newThreads.sort(
        (a, b) =>
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
      );

      return { ...state, threads: newThreads };
    }

    case 'UPDATE_THREAD_MESSAGE': {
      const threadIndex = state.threads.findIndex(
        (t) => t.other_user_id === action.otherUserId
      );

      if (threadIndex === -1) {
        logger.info('RT:List', 'Message from new conversation partner, fetching thread data');
        return state;
      }

      const newThreads = [...state.threads];
      const thread = newThreads[threadIndex];

      newThreads[threadIndex] = {
        ...thread,
        last_message: action.message,
      };

      newThreads.sort(
        (a, b) =>
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
      );

      return { ...state, threads: newThreads };
    }

    case 'MERGE_NEW_THREADS': {
      const existingIds = new Set(state.threads.map((t) => t.other_user_id));
      const newThreads = action.threads.filter((t) => !existingIds.has(t.other_user_id));

      if (newThreads.length === 0) return state;

      const combined = [...state.threads, ...newThreads];
      combined.sort(
        (a, b) =>
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
      );

      return { ...state, threads: combined };
    }

    case 'UPDATE_THREAD_ANONYMITY': {
      const threadIndex = state.threads.findIndex(
        (t) => t.other_user_id === action.otherUserId
      );

      if (threadIndex === -1) return state;

      const newThreads = [...state.threads];
      newThreads[threadIndex] = {
        ...newThreads[threadIndex],
        is_anonymous: action.isAnonymous,
      };

      return { ...state, threads: newThreads };
    }

    default:
      return state;
  }
}

const MessagesScreen: React.FC = () => {
  const router = useRouter();
  const { isVisible, locationPermissionDenied } = useVisibility();
  const { threadUnread, refreshUnread } = useMessaging();

  const [state, dispatch] = useReducer(threadsReducer, {
    threads: [],
    loading: true,
    initialLoadComplete: false,
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const eventQueueRef = useRef<Array<() => void>>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeUnsubscribe | null>(null);
  const locationChannelRef = useRef<RealtimeUnsubscribe | null>(null);
  const newConversationCheckRef = useRef<Set<string>>(new Set());
  const threadsRef = useRef<MessageThread[]>([]);

  useEffect(() => {
    threadsRef.current = state.threads;
  }, [state.threads]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getCurrentUser();
      if (mounted) setCurrentUserId(user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const processBatchedEvents = useCallback(() => {
    if (eventQueueRef.current.length === 0) return;

    logger.debug('RT:List', `Processing ${eventQueueRef.current.length} batched events`);
    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    events.forEach((fn) => fn());
  }, []);

  const queueEvent = useCallback(
    (fn: () => void) => {
      eventQueueRef.current.push(fn);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        processBatchedEvents();
      }, 50) as ReturnType<typeof setTimeout>;
    },
    [processBatchedEvents]
  );

  const loadThreads = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) {
        dispatch({ type: 'SET_LOADING', loading: true });
      }

      try {
        const { threads: threadsData, error } = await getUserMessageThreads();
        if (error) {
          if (error.message !== 'Not authenticated') {
            logger.error('RT:List', 'Error loading threads:', error);
          }
          dispatch({ type: 'SET_THREADS', threads: [] });
          return;
        }

        dispatch({ type: 'SET_THREADS', threads: threadsData });

        if (!state.initialLoadComplete) {
          dispatch({ type: 'INITIAL_LOAD_COMPLETE' });
        }

        refreshUnread().catch((err) => {
          logger.error('RT:List', 'Failed to refresh unread counts', err);
        });
      } catch (error) {
        logger.error('RT:List', 'Exception loading threads:', error);
        if (showSpinner) {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      }
    },
    [refreshUnread, state.initialLoadComplete]
  );

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return;
      loadThreads(false);
    }, [currentUserId, loadThreads])
  );

  useEffect(() => {
    if (!currentUserId) return;

    logger.debug('RT:List', 'Setting up message realtime subscription');

    const handleMessageEvent = async ({ new: messageData }: RealtimeChange<Message>) => {
      if (!messageData) return;

      const isMyMessage = messageData.sender_id === currentUserId;
      const otherUserId = isMyMessage ? messageData.receiver_id : messageData.sender_id;

      const existingThread = threadsRef.current.find((t) => t.other_user_id === otherUserId);

      if (!existingThread && !newConversationCheckRef.current.has(otherUserId)) {
        logger.debug('RT:List', 'New conversation detected, fetching threads silently');
        newConversationCheckRef.current.add(otherUserId);

        setTimeout(async () => {
          const { threads: freshThreads, error } = await getUserMessageThreads();
          if (!error && freshThreads) {
            dispatch({ type: 'MERGE_NEW_THREADS', threads: freshThreads });
          }
          newConversationCheckRef.current.delete(otherUserId);
        }, 500);
      } else {
        logger.debug('RT:List', 'New message event, updating thread silently');
        queueEvent(() => {
          dispatch({
            type: 'UPDATE_THREAD_MESSAGE',
            otherUserId,
            message: messageData,
          });
        });
      }
    };

    channelRef.current = subscribeToMessageListUpdates(currentUserId, {
      onInsert: handleMessageEvent,
      onUpdate: ({ new: messageData }) => {
          if (!messageData) return;

          const isMyMessage = messageData.sender_id === currentUserId;
          const otherUserId = isMyMessage ? messageData.receiver_id : messageData.sender_id;

          queueEvent(() => {
            dispatch({
              type: 'UPDATE_THREAD_MESSAGE',
              otherUserId,
              message: messageData,
            });
          });
      },
      onStatus: (status: string) => {
        logger.info('RT:List', `Messages channel status: ${status}`);
      },
    });

    return () => {
      if (channelRef.current) {
        logger.debug('RT:List', 'Cleaning up message subscription');
        channelRef.current();
        channelRef.current = null;
      }
    };
  }, [currentUserId, queueEvent]);

  useEffect(() => {
    if (!currentUserId || state.threads.length === 0) return;

    logger.debug('RT:List', 'Setting up location realtime subscription');

    const conversationPartnerIds = state.threads.map((t) => t.other_user_id);

    const handleLocationUpdate = async (otherUserId: string) => {
      const { isNearby } = await isUserNearby(otherUserId);
      logger.debug('RT:List', 'Location update, updating anonymity silently');
      queueEvent(() => {
        dispatch({
          type: 'UPDATE_THREAD_ANONYMITY',
          otherUserId,
          isAnonymous: !isNearby,
        });
      });
    };

    locationChannelRef.current = subscribeToMessagePartnerLocationUpdates(
      conversationPartnerIds,
      ({ new: locationData }) => {
        if (locationData) {
          void handleLocationUpdate(locationData.id);
        }
      },
      (status: string) => {
        logger.info('RT:List', `Location channel status: ${status}`);
      },
    );

    return () => {
      if (locationChannelRef.current) {
        logger.debug('RT:List', 'Cleaning up location subscription');
        locationChannelRef.current();
        locationChannelRef.current = null;
      }
    };
  }, [currentUserId, state.threads, queueEvent]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        logger.info('RT:List', 'App became active, reloading threads silently');
        loadThreads(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadThreads]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleHeaderRefresh = useCallback(() => {
    loadThreads(true);
  }, [loadThreads]);

  const chatThreads = state.threads.map((thread) => ({
    id: thread.other_user_id,
    peer: {
      id: thread.other_user.id,
      name: thread.other_user.display_name,
      avatar: thread.other_user.social_links?.profile_pic_url || FALLBACK_AVATAR,
    },
    isAnonymous: thread.is_anonymous,
    lastMessageAt: thread.last_message.created_at,
    lastMessageSnippet: thread.last_message.text,
    unreadCount: threadUnread[thread.other_user_id] ?? thread.unread_count ?? 0,
  }));

  if (state.loading && !state.initialLoadComplete) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppHeader title="Messages" onTitlePress={handleHeaderRefresh} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Messages" onTitlePress={handleHeaderRefresh} />
      {state.threads.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Discover people on Radar, open a profile, and start a message when someone feels worth meeting.
          </Text>
        </View>
      ) : (
        <View style={styles.scrollContent}>
          <ChatList
            threads={chatThreads}
            onPressThread={(threadId: string) => router.push(`/messages/${threadId}`)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 180,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default MessagesScreen;
