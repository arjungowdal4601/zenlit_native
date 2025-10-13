import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import ChatList from '../../src/components/messaging/ChatList';
import Navigation from '../../src/components/Navigation';
import { getUserConversations, type ConversationWithParticipant } from '../../src/lib/database';
import { useVisibility } from '../../src/contexts/VisibilityContext';
import { supabase } from '../../src/lib/supabase';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const MessagesScreen: React.FC = () => {
  const router = useRouter();
  const { isVisible, locationPermissionDenied } = useVisibility();
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      const { conversations: conversationsData, error } = await getUserConversations();

      if (error) {
        console.error('Error loading conversations:', error);
      } else {
        setConversations(conversationsData);
      }

      setLoading(false);
    };

    loadConversations();
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
    };
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Messages" />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ChatList
            threads={threads}
            onPressThread={(threadId) => router.push(`/messages/${threadId}`)}
          />
        </ScrollView>
      )}
      <Navigation activePath="/messages" />
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
