import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import ChatList from '../../src/components/messaging/ChatList';
import Navigation from '../../src/components/Navigation';
import { getUserConversations, type ConversationWithParticipant, type Conversation, type Message } from '../../src/lib/database';
import { useVisibility } from '../../src/contexts/VisibilityContext';
import { supabase } from '../../src/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useMessaging } from '../../src/contexts/MessagingContext';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const MessagesScreen: React.FC = () => {
  const router = useRouter();
  const { isVisible, locationPermissionDenied } = useVisibility();
  const { threadUnread, refreshUnread } = useMessaging();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [lastTextMap, setLastTextMap] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(data.user?.id ?? null);
    })();
    return () => { mounted = false; };
  }, []);

  // Helper to load conversations and last message snippets
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { conversations: conversationsData, error } = await getUserConversations();
      if (error) {
        setConversations([]);
        setLastTextMap({});
        return;
      }
      setConversations(conversationsData);

      // Fetch last message snippet for each conversation in parallel
      const entries = await Promise.all(
        conversationsData.map(async (conv) => {
          try {
            const { data: messagesData } = await supabase
              .from('messages')
              .select('id, text')
               .eq('conversation_id', conv.id)
               .order('created_at', { ascending: false })
               .limit(1);

            const last = messagesData?.[0];
            const snippet = last?.text ?? '';
             return [conv.id, snippet] as const;
          } catch (e) {
            return [conv.id, ''] as const;
          }
        })
      );

      const nextMap: Record<string, string> = {};
      for (const [id, snippet] of entries) nextMap[id] = snippet;
      setLastTextMap(nextMap);
      refreshUnread().catch((err) => {
        console.error('Failed to refresh unread counts', err);
      });
    } finally {
      setLoading(false);
    }
  }, [refreshUnread]);

  // Initial load and refresh when triggered externally
  useEffect(() => {
    loadConversations();
  }, [loadConversations, refreshSignal]);

  // Auto-refresh when visibility or location permission changes
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, locationPermissionDenied]);

  // Realtime refresh when conversations or messages change
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('messages-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload: RealtimePostgresChangesPayload<Conversation>) => {
          // If we have a new row, only refresh when it involves the current user.
          if (payload.new) {
            const row = payload.new as Conversation;
            if (row.user_a_id === currentUserId || row.user_b_id === currentUserId) {
              loadConversations();
            }
          } else {
            // For DELETE or cases where new is unavailable, refresh conservatively.
            loadConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const row = payload.new as Message | null;
          if (!row) return;
          // If a new message arrives for a conversation we see, refresh snippets
          if (conversations.find((c) => c.id === row.conversation_id)) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, conversations, loadConversations]);

  const handleHeaderRefresh = useCallback(() => {
    setRefreshSignal((value) => value + 1);
  }, []);

  const threads = conversations.map((conv) => {
    const isAnonymous = currentUserId === conv.user_a_id
      ? conv.is_anonymous_for_a
      : conv.is_anonymous_for_b;

    return {
      id: conv.id,
      peer: {
        id: conv.other_user.id,
        name: isAnonymous ? 'Anonymous' : conv.other_user.display_name,
        avatar: isAnonymous ? FALLBACK_AVATAR : (conv.other_user.social_links?.profile_pic_url || FALLBACK_AVATAR),
      },
      isAnonymous,
      lastMessageAt: conv.last_message_at,
      lastMessageSnippet: lastTextMap[conv.id] || '',
      unreadCount: threadUnread[conv.id] ?? 0,
    };
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Messages" onTitlePress={handleHeaderRefresh} />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            You don't have any conversations yet. Start chatting by discovering people nearby.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ChatList
            threads={threads}
            onPressThread={(threadId: string) => router.push(`/messages/${threadId}`)}
          />
        </ScrollView>
      )}
      <Navigation />
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
  },
});

export default MessagesScreen;
