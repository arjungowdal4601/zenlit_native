import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Compass, MessageSquare, Plus, UserCircle, Users } from 'lucide-react-native';

import { theme } from '../styles/theme';

const tabs = [
  { id: 'radar', icon: Users },
  { id: 'discover', icon: Compass },
  { id: 'create', icon: Plus },
  { id: 'messages', icon: MessageSquare },
  { id: 'profile', icon: UserCircle },
] as const;

type TabId = typeof tabs[number]['id'];

type NavigationProps = {
  activeTab: TabId;
  onTabPress?: (tab: TabId) => void;
};

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {tabs.map(({ id, icon: Icon }) => {
        const isActive = id === activeTab;
        return (
          <Pressable
            key={id}
            style={[styles.tab, isActive ? styles.tabActive : null]}
            onPress={() => onTabPress?.(id)}
            accessibilityRole="button"
            accessibilityLabel={`${id} tab`}
          >
            <Icon color={theme.colors.icon} size={22} strokeWidth={isActive ? 2.4 : 2} />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.tabBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.muted,
  },
});
