import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import ChatListItem from './ChatListItem';
import EmptyState from './EmptyState';
import SkeletonRows from './Skeletons';

export type Thread = {
  id: string;
  peer: {
    id: string;
    name: string;
    avatar: string;
  };
  isAnonymous: boolean;
  lastMessageAt: string;
  unreadCount?: number;
};

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

const formatMessageTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
};

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
              subtitle="Tap to view conversation"
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
              subtitle="Tap to view conversation"
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
