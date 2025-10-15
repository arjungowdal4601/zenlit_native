import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import ChatHeader from '../../src/components/messaging/ChatHeader';
import Composer from '../../src/components/messaging/Composer';
import DayDivider from '../../src/components/messaging/DayDivider';
import MessageBubble from '../../src/components/messaging/MessageBubble';
import { theme } from '../../src/styles/theme';
import {
  getConversationById,
  getMessagesForConversation,
  sendMessage,
  type Message,
  type Conversation,
  getProfileById,
  type Profile,
  type SocialLinks,
} from '../../src/lib/database';
import { supabase } from '../../src/lib/supabase';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const formatDayLabel = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

type ChatMsg = {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
};

type RenderItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; id: string; message: ChatMsg };

const ChatDetailScreen: React.FC = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

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
    const loadConversation = async () => {
      if (!conversationId || !currentUserId) return;

      setLoading(true);

      const { conversation: convData, error: convError } = await getConversationById(conversationId);

      if (convError || !convData) {
        console.error('Error loading conversation:', convError);
        setLoading(false);
        return;
      }

      setConversation(convData);

      const otherUserId = convData.user_a_id === currentUserId ? convData.user_b_id : convData.user_a_id;
      const isAnon = convData.user_a_id === currentUserId ? convData.is_anonymous_for_a : convData.is_anonymous_for_b;
      setIsAnonymous(isAnon);

      const { profile, socialLinks: social, error: profileError } = await getProfileById(otherUserId);

      if (profileError || !profile) {
        console.error('Error loading profile:', profileError);
      } else {
        setOtherUser(profile);
        setSocialLinks(social);
      }

      const { messages: messagesData, error: messagesError } = await getMessagesForConversation(conversationId);

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
      } else {
        const chatMessages: ChatMsg[] = messagesData.map((msg: Message) => ({
          id: msg.id,
          text: msg.text || '',
          sentAt: msg.created_at,
          fromMe: msg.sender_id === currentUserId,
        }));
        setMessages(chatMessages);
      }

      setLoading(false);
    };

    loadConversation();
  }, [conversationId, currentUserId]);

  const listRef = useRef<FlatList<RenderItem>>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [conversationId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const data = useMemo<RenderItem[]>(() => {
    const entries: RenderItem[] = [];
    let currentLabel: string | null = null;
    messages.forEach((message) => {
      const label = formatDayLabel(message.sentAt);
      if (label !== currentLabel) {
        currentLabel = label;
        entries.push({ type: 'day', id: `day-${label}-${message.id}`, label });
      }
      entries.push({ type: 'message', id: message.id, message });
    });
    return entries;
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!conversationId || !text.trim()) {
      return;
    }

    const optimisticMessage: ChatMsg = {
      id: `local-${Date.now()}`,
      text,
      sentAt: new Date().toISOString(),
      fromMe: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const { message, error } = await sendMessage(conversationId, text);

    if (error) {
      console.error('Error sending message:', error);
    } else if (message) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticMessage.id);
        return [...filtered, {
          id: message.id,
          text: message.text || '',
          sentAt: message.created_at,
          fromMe: true,
        }];
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.missingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ChatHeader title="Loading..." />
        </SafeAreaView>
        <View style={styles.missingContent}>
          <Text style={styles.missingText}>Loading conversation...</Text>
        </View>
      </View>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <View style={styles.missingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ChatHeader title="Message" />
        </SafeAreaView>
        <View style={styles.missingContent}>
          <Text style={styles.missingText}>Conversation not found.</Text>
        </View>
      </View>
    );
  }

  const displayName = isAnonymous ? 'Anonymous' : otherUser.display_name;
  const displayAvatar = isAnonymous ? FALLBACK_AVATAR : (socialLinks?.profile_pic_url || FALLBACK_AVATAR);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ChatHeader
          title={displayName}
          avatarUrl={displayAvatar}
          isAnonymous={isAnonymous}
        />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 18, android: 0 }) ?? 0}
      >
        <View style={styles.messagesArea}>
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.type === 'day') {
                return <DayDivider label={item.label} />;
              }
              return <MessageBubble message={item.message} />;
            }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
          <SafeAreaView edges={['bottom']} style={styles.composerWrapper}>
            <Composer onSend={handleSend} />
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  missingRoot: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.headerBackground,
  },
  missingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: theme.colors.muted,
    fontSize: 16,
  },
  flex: {
    flex: 1,
  },
  messagesArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 72,
    gap: 4,
  },
  composerWrapper: {
    backgroundColor: theme.colors.surface,
  },
});

export default ChatDetailScreen;
