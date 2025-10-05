import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, MessageSquare, Plus, UserCircle, Users } from 'lucide-react-native';

const navigationItems = [
  { path: '/radar', Icon: Users },
  { path: '/feed', Icon: Compass },
  { path: '/create', Icon: Plus },
  { path: '/messages', Icon: MessageSquare },
  { path: '/profile', Icon: UserCircle },
] as const;

export type NavigationProps = {
  activePath?: string;
};

const Navigation: React.FC<NavigationProps> = ({ activePath }) => {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (pathname.startsWith('/messages/')) {
    return null;
  }

  const currentPath = activePath ?? pathname;
  const isOtherUserProfile = currentPath.startsWith('/profile/');

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.inner}>
        {navigationItems.map(({ path, Icon }) => {
          let isActive = currentPath === path || currentPath.startsWith(`${path}/`);

          if (path === '/radar') {
            isActive = currentPath === '/radar' || isOtherUserProfile;
          }

          if (path === '/profile') {
            isActive = currentPath === '/profile';
          }

          return (
            <Pressable
              key={path}
              accessibilityRole="button"
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
              <Icon color="#ffffff" size={28} strokeWidth={2} />
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
    backgroundColor: '#000000',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
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
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  tabButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 1,
    shadowColor: 'rgba(255, 255, 255, 0.35)',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});

export default Navigation;
