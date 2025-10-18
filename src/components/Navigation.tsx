import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, MessageSquare, Plus, UserCircle, Users } from 'lucide-react-native';

import { theme } from '../styles/theme';
import { useMessaging } from '../contexts/MessagingContext';

const navigationItems = [
  { path: '/radar', Icon: Users, label: 'Radar' },
  { path: '/feed', Icon: Compass, label: 'Feed' },
  { path: '/create', Icon: Plus, label: 'Create' },
  { path: '/messages', Icon: MessageSquare, label: 'Messages' },
  { path: '/profile', Icon: UserCircle, label: 'Profile' },
] as const;

export type NavigationProps = {
  activePath?: string;
};

const Navigation: React.FC<NavigationProps> = ({ activePath }) => {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalUnread } = useMessaging();

  if (pathname.startsWith('/messages/')) {
    return null;
  }

  const currentPath = activePath ?? pathname;
  const isOtherUserProfile = currentPath.startsWith('/profile/');

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      <View style={styles.inner}>
        {navigationItems.map(({ path, Icon, label }) => {
          let isActive = currentPath === path || currentPath.startsWith(`${path}/`);

          if (path === '/radar') {
            isActive = currentPath === '/radar' || isOtherUserProfile;
          }

          if (path === '/profile') {
            isActive = currentPath === '/profile';
          }

          const unreadLabel = totalUnread > 99 ? '99+' : String(totalUnread);
          const unreadMessageLabel =
            totalUnread === 1 ? `${unreadLabel} unread message` : `${unreadLabel} unread messages`;

          return (
            <Pressable
              key={path}
              accessibilityRole="button"
              accessibilityLabel={
                path === '/messages' && totalUnread > 0
                  ? `${label}, ${unreadMessageLabel}`
                  : label
              }
              onPress={() => {
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  const activeElement = document.activeElement as HTMLElement | null;
                  activeElement?.blur();
                }

                if (currentPath !== path) {
                  router.push(path);
                }
              }}
              style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
            >
              <View style={styles.iconWrapper} accessible={false}>
                <Icon color="#ffffff" size={24} strokeWidth={2} />
                {path === '/messages' && totalUnread > 0 ? (
                  <View
                    style={styles.badge}
                    accessibilityLabel={unreadMessageLabel}
                    accessibilityRole="text"
                  >
                    <Text style={styles.badgeText}>{unreadLabel}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  tabButton: {
    width: 52,
  	height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: Platform.OS === 'ios' ? 1 : 0,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255, 255, 255, 0.35)',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Navigation;
