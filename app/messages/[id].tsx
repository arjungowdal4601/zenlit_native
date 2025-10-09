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
import type { ChatMsg } from '../../src/constants/messagesData';
import {
  MESSAGES_BY_THREAD,
  THREADS,
  formatDayLabel,
} from '../../src/constants/messagesData';
import { theme } from '../../src/styles/theme';

type RenderItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; id: string; message: ChatMsg };

const ChatDetailScreen: React.FC = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const threadId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

  const thread = useMemo(() => THREADS.find((item) => item.id === threadId), [threadId]);

  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    thread ? [...(MESSAGES_BY_THREAD[thread.id] ?? [])] : [],
  );

  useEffect(() => {
    if (thread) {
      setMessages([...(MESSAGES_BY_THREAD[thread.id] ?? [])]);
    }
  }, [thread]);

  const listRef = useRef<FlatList<RenderItem>>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [thread?.id]);

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

  const handleSend = (text: string) => {
    if (!thread) {
      return;
    }
    const newMessage: ChatMsg = {
      id: `local-${Date.now()}`,
      text,
      sentAt: new Date().toISOString(),
      fromMe: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  if (!thread) {
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

  // Remove online status text entirely per request
  const subtitle = undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ChatHeader
          title={thread.peer.name}
          avatarUrl={thread.isAnonymous ? undefined : thread.peer.avatar}
          isAnonymous={thread.isAnonymous}
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
