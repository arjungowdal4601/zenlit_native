import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { Thread } from '../../constants/messagesData';
import {
  formatDayLabel,
  formatMessageTime,
  getLastMessageForThread,
} from '../../constants/messagesData';
import ChatListItem from './ChatListItem';
import EmptyState from './EmptyState';
import SkeletonRows from './Skeletons';

export type ChatListProps = {
  threads: Thread[];
  onPressThread: (threadId: string) => void;
};

const LABEL_TEXT_STYLE = {
  color: '#94a3b8',
  fontSize: 11,
  letterSpacing: 2,
};

const ChatList: React.FC<ChatListProps> = ({ threads, onPressThread }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(timer);
  }, []);

  const { normalThreads, anonymousThreads } = useMemo(() => {
    const normals: Thread[] = [];
    const anons: Thread[] = [];
    threads.forEach((thread) => {
      if (thread.isAnonymous) {
        anons.push(thread);
      } else {
        normals.push(thread);
      }
    });
    return { normalThreads: normals, anonymousThreads: anons };
  }, [threads]);

  const timeLabelFor = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return sameDay ? formatMessageTime(iso) : formatDayLabel(iso);
  };

  const previewFor = (threadId: string) => {
    const last = getLastMessageForThread(threadId);
    if (!last) {
      return '';
    }
    const prefix = last.fromMe ? 'You: ' : '';
    return `${prefix}${last.text}`;
  };

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <SkeletonRows count={7} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionContainer}>
        {normalThreads.length === 0 ? (
          <EmptyState title="No conversations yet" subtitle="Start a chat from the radar." />
        ) : (
          normalThreads.map((thread) => (
            <ChatListItem
              key={thread.id}
              title={thread.peer.name}
              subtitle={previewFor(thread.id)}
              timeLabel={timeLabelFor(thread.lastMessageAt)}
              unreadCount={thread.unreadCount || undefined}
              avatarUrl={thread.peer.avatar}
              onPress={() => onPressThread(thread.id)}
            />
          ))
        )}
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.sectionLine} />
        <View style={styles.sectionChip}>
          <Feather name="eye" size={14} color="#94a3b8" />
          <Text style={LABEL_TEXT_STYLE}>  ANONYMOUS</Text>
        </View>
        <View style={styles.sectionLine} />
      </View>

      <View style={styles.sectionContainer}>
        {anonymousThreads.length === 0 ? (
          <EmptyState title="No anonymous chats" subtitle="Start a conversation anonymously." />
        ) : (
          anonymousThreads.map((thread) => (
            <ChatListItem
              key={thread.id}
              title={thread.peer.name}
              subtitle={previewFor(thread.id)}
              timeLabel={timeLabelFor(thread.lastMessageAt)}
              unreadCount={thread.unreadCount || undefined}
              isAnonymous
              onPress={() => onPressThread(thread.id)}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 140,
    gap: 24,
  },
  sectionContainer: {
    // Remove any bounding box or outline; let items sit on black page
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  sectionDivider: {
    // Center the label without lines or chip box
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 0,
    marginVertical: 4,
  },
  sectionLine: {
    // No dividing lines
    flex: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  sectionChip: {
    // Plain label without border or background
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
});

export default ChatList;
