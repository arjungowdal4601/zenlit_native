import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ChatListItemProps = {
  title: string;
  subtitle: string;
  timeLabel: string;
  unreadCount?: number;
  avatarUrl?: string;
  isAnonymous?: boolean;
  onPress: () => void;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  title,
  subtitle,
  timeLabel,
  unreadCount,
  avatarUrl,
  isAnonymous = false,
  onPress,
}) => (
  <Pressable style={styles.container} onPress={onPress}>
    <View style={styles.avatarFrame}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarFallback} />
      )}
    </View>

    <View style={styles.content}>
      <View style={styles.primaryRow}>
        <Text style={styles.title} numberOfLines={1}>
          {isAnonymous ? 'Anonymous' : title}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {timeLabel}
        </Text>
      </View>
      <View style={styles.secondaryRow}>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        {unreadCount ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </View>

    <Feather name="chevron-right" size={18} color="rgba(148,163,184,0.6)" />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#000000',
  },
  avatarFrame: {
    width: 52,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  time: {
    color: '#94a3b8',
    fontSize: 12,
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  unreadBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  unreadText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatListItem;
