import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import ChatHeader from '../../src/components/messaging/ChatHeader';
import Composer from '../../src/components/messaging/Composer';
import DayDivider from '../../src/components/messaging/DayDivider';
import MessageBubble, { type MessageStatus } from '../../src/components/messaging/MessageBubble';
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
import { useMessaging } from '../../src/contexts/MessagingContext';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const formatDayLabel = (isoDate: string): string => {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

type ChatMsg = {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
  status: MessageStatus;
};

type RenderItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; id: string; message: ChatMsg };

const sortMessagesAsc = (list: ChatMsg[]) =>
  [...list].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

const ChatDetailScreen: React.FC = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

  const { markThreadDelivered, markThreadRead, setActiveConversation } = useMessaging();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const mapServerMessage = useCallback(
    (msg: Message): ChatMsg => {
      if (!currentUserId) {
        return {
          id: msg.id,
          text: msg.text || '',
          sentAt: msg.created_at,
          fromMe: false,
          status: 'sent',
        };
      }

      const fromMe = msg.sender_id === currentUserId;
      let status: MessageStatus = 'sent';
      if (fromMe) {
        if (msg.read_at) {
          status = 'read';
        } else if (msg.delivered_at) {
          status = 'delivered';
        } else {
          status = 'sent';
        }
      }

      return {
        id: msg.id,
        text: msg.text || '',
        sentAt: msg.created_at,
        fromMe,
        status,
      };
    },
    [currentUserId]
  );

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) {
        return () => {};
      }

      setActiveConversation(conversationId);
      markThreadDelivered(conversationId).catch((error) => {
        console.error('Failed to mark conversation delivered on focus', error);
      });
      markThreadRead(conversationId).catch((error) => {
        console.error('Failed to mark conversation read on focus', error);
      });

      return () => {
        setActiveConversation(null);
      };
    }, [conversationId, markThreadDelivered, markThreadRead, setActiveConversation])
  );

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
        const chatMessages = sortMessagesAsc(messagesData.map(mapServerMessage));
        setMessages(chatMessages);
      }

      setLoading(false);
    };

    loadConversation();
  }, [conversationId, currentUserId, mapServerMessage]);

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

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      return;
    }

    const channel = supabase
      .channel(`chat-thread-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new;
          if (!newMessage) {
            return;
          }

          setMessages((prev) => {
            const mapped = mapServerMessage(newMessage);
            const existingIndex = prev.findIndex((m) => m.id === mapped.id);
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = mapped;
              return sortMessagesAsc(next);
            }
            return sortMessagesAsc([...prev, mapped]);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const updatedMessage = payload.new;
          if (!updatedMessage) {
            return;
          }

          setMessages((prev) => {
            const index = prev.findIndex((m) => m.id === updatedMessage.id);
            if (index === -1) {
              return prev;
            }
            const next = [...prev];
            next[index] = mapServerMessage(updatedMessage);
            return sortMessagesAsc(next);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, mapServerMessage]);

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
    if (!conversationId) {
      return;
    }

    const body = text.trim();
    if (!body) {
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticMessage: ChatMsg = {
      id: optimisticId,
      text: body,
      sentAt: nowIso,
      fromMe: true,
      status: 'pending',
    };

    setMessages((prev) => sortMessagesAsc([...prev, optimisticMessage]));

    try {
      const { message, error } = await sendMessage(conversationId, body);
      if (error || !message) {
        throw error ?? new Error('Message failed to send');
      }

      setMessages((prev) =>
        sortMessagesAsc(
          prev.map((m) => (m.id === optimisticId ? mapServerMessage(message) : m))
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  const handleRetry = useCallback(
    async (message: ChatMsg) => {
      if (!conversationId) {
        return;
      }

      const retryTimestamp = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, status: 'pending', sentAt: retryTimestamp }
            : m
        )
      );

      try {
        const { message: sentMessage, error } = await sendMessage(conversationId, message.text);
        if (error || !sentMessage) {
          throw error ?? new Error('Retry failed');
        }

        setMessages((prev) =>
          sortMessagesAsc(
            prev.map((m) => (m.id === message.id ? mapServerMessage(sentMessage) : m))
          )
        );
      } catch (err) {
        console.error('Error retrying message send:', err);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [conversationId, mapServerMessage]
  );

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
              return (
                <MessageBubble
                  text={item.message.text}
                  createdAt={item.message.sentAt}
                  isMine={item.message.fromMe}
                  status={item.message.status}
                  onRetry={item.message.status === 'failed' ? () => handleRetry(item.message) : undefined}
                />
              );
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
