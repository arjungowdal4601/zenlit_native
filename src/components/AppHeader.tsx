import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ICON_SIZE = 24;

export type AppHeaderProps = {
  onToggleSearch: () => void;
  onOpenVisibility: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSearch, onOpenVisibility }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zenlit</Text>
      <View style={styles.actions}>
        <Pressable onPress={onToggleSearch} style={styles.iconButton} accessibilityRole="button">
          <Feather name="search" size={ICON_SIZE} color="#ffffff" />
        </Pressable>
        <Pressable onPress={onOpenVisibility} style={[styles.iconButton, styles.iconSpacing]} accessibilityRole="button">
          <Feather name="menu" size={ICON_SIZE} color="#ffffff" />
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
});

export default AppHeader;
