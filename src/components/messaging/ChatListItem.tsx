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
}) => {
  const hasUnread = !!unreadCount && unreadCount > 0;
  const unreadLabel = hasUnread ? (unreadCount > 99 ? '99+' : String(unreadCount)) : '';
  const accessibilityLabelParts = [
    isAnonymous ? 'Anonymous' : title,
    subtitle,
    timeLabel,
  ].filter(Boolean);
  if (hasUnread) {
    accessibilityLabelParts.push(
      unreadCount === 1 ? '1 unread message' : `${unreadLabel} unread messages`,
    );
  }

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabelParts.join(', ')}
    >
      <View style={styles.avatarFrame}>
        {avatarUrl && !isAnonymous ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Feather name="user" size={20} color="rgba(148,163,184,0.6)" />
          </View>
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
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
          {hasUnread ? (
            <View
              style={styles.unreadBadge}
              accessibilityRole="text"
              accessibilityLabel={
                unreadCount && unreadCount > 99
                  ? '99 plus unread messages'
                  : unreadCount === 1
                    ? '1 unread message'
                    : `${unreadCount} unread messages`
              }
            >
              <Text style={styles.unreadText}>{unreadLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Feather name="chevron-right" size={18} color="rgba(148,163,184,0.6)" />
    </Pressable>
  );
};

const AVATAR_SIZE = 42; // ~80% of previous 52
const AVATAR_RADIUS = AVATAR_SIZE / 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6, // reduced by ~60% from 16 to move content left
    paddingRight: 16,
    paddingVertical: 11, // compact row height maintained
    backgroundColor: '#000000',
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS, // circular in Messages only
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // tighter spacing
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
    marginTop: 2, // tighter grouping between name and last message
  },
  title: {
    color: '#ffffff',
    fontSize: 14, // slightly smaller than before
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  time: {
    color: '#94a3b8',
    fontSize: 11, // smaller, lighter tone
  },
  subtitle: {
    color: 'rgba(148,163,184,0.9)', // secondary, muted
    fontSize: 12, // reduced for secondary emphasis
    flex: 1,
    marginRight: 12,
  },
  unreadBadge: {
    minWidth: 22,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatListItem;
