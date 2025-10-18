import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ChatListItem, { ChatListItemProps } from './ChatListItem';
import DayDivider from './DayDivider';

export type ChatListProps = {
  threads: any[];
  onPressThread: (threadId: string) => void;
};

// Helpers for time formatting per requirements
const pad2 = (n: number) => String(n).padStart(2, '0');
const formatHHmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const formatDMY = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isYesterday = (date: Date, today: Date) => {
  const y = new Date(today);
  y.setHours(0, 0, 0, 0);
  y.setDate(y.getDate() - 1);
  return isSameDay(date, y);
};

const timeLabelFor = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  if (isSameDay(date, today)) return formatHHmm(date);
  if (isYesterday(date, today)) return 'Yesterday';
  return formatDMY(date);
};

// Get comparable timestamp for sorting
const getTime = (t: any) => t.lastMessageAt ?? t.last_message_at ?? t.lastMessageISO ?? '';

// Display items: either a thread row or the anonymous separator
type DisplayItem =
  | { kind: 'thread'; id: string; thread: any }
  | { kind: 'separator'; id: string };

const ChatList: React.FC<ChatListProps> = ({ threads, onPressThread }) => {
  // Split into regular and anonymous
  const regular = threads.filter((t) => !t.isAnonymous);
  const anonymous = threads.filter((t) => !!t.isAnonymous);

  // Sort each section by last message time desc
  const byTimeDesc = (a: any, b: any) => {
    const ta = getTime(a);
    const tb = getTime(b);
    // Newest first; fallback empty strings go last
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(tb).getTime() - new Date(ta).getTime();
  };

  regular.sort(byTimeDesc);
  anonymous.sort(byTimeDesc);

  const items: DisplayItem[] = [];
  // Always render regular first
  for (const t of regular) items.push({ kind: 'thread', id: String(t.id), thread: t });
  // If there are anonymous chats, render a divider then the anonymous ones
  if (anonymous.length > 0) {
    items.push({ kind: 'separator', id: 'anonymous-divider' });
    for (const t of anonymous) items.push({ kind: 'thread', id: String(t.id), thread: t });
  }

  const renderItem = ({ item }: { item: DisplayItem }) => {
    if (item.kind === 'separator') {
      return <DayDivider label="ANONYMOUS" />;
    }

    const raw = item.thread;
    const title: string = raw.title ?? raw.peer?.name ?? '';
    const subtitle: string = raw.lastMessage ?? raw.lastMessageSnippet ?? '';
    const avatarUrl: string | undefined = raw.avatarUrl ?? raw.peer?.avatar;
    const timeIso: string | undefined = raw.lastMessageAt ?? raw.last_message_at ?? raw.lastMessageISO;

    const props: ChatListItemProps = {
      title,
      subtitle,
      timeLabel: timeLabelFor(timeIso),
      unreadCount: raw.unreadCount,
      avatarUrl,
      isAnonymous: raw.isAnonymous,
      onPress: () => onPressThread(raw.id),
    };

    return <ChatListItem {...props} />;
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
});

export default ChatList;
