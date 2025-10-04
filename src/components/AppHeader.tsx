import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { theme } from '../styles/theme';

type AppHeaderProps = {
  title: string;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title, onSearchPress, onMenuPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={onSearchPress}
        >
          <Feather name="search" size={theme.iconSizes.lg} color={theme.colors.icon} />
        </Pressable>
        <Pressable
          style={[styles.iconButton, styles.iconSpacing]}
          accessibilityRole="button"
          accessibilityLabel="Visibility settings"
          onPress={onMenuPress}
        >
          <Feather name="sliders" size={theme.iconSizes.lg} color={theme.colors.icon} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  title: {
    color: theme.colors.icon,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  iconSpacing: {
    marginLeft: theme.spacing.xs,
  },
});
