import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ICON_SIZE = 24;

export type AppHeaderProps = {
  title?: string;
  onToggleSearch?: () => void;
  onOpenVisibility?: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'Zenlit',
  onToggleSearch,
  onOpenVisibility,
}) => {
  const showSearch = typeof onToggleSearch === 'function';
  const showMenu = typeof onOpenVisibility === 'function';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {(showSearch || showMenu) ? (
        <View style={styles.actions}>
          {showSearch ? (
            <Pressable
              onPress={onToggleSearch}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Toggle search"
            >
              <Feather name="search" size={ICON_SIZE} color="#ffffff" />
            </Pressable>
          ) : null}
          {showMenu ? (
            <Pressable
              onPress={onOpenVisibility}
              style={[styles.iconButton, showSearch ? styles.iconSpacing : null]}
              accessibilityRole="button"
              accessibilityLabel="Open visibility settings"
            >
              <Feather name="menu" size={ICON_SIZE} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  iconSpacing: {
    marginLeft: 12,
  },
  spacer: {
    width: 44,
    height: 44,
  },
});

export default AppHeader;
