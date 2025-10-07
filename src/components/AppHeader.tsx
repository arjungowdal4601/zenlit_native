import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import GradientTitle from './GradientTitle';
import { theme } from '../styles/theme';
import { createShadowStyle } from '../utils/shadow';

const ICON_SIZE = theme.header.iconSize;
const TOUCH_SIZE = theme.header.touchSize;
const ICON_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 } as const;

export type AppHeaderProps = {
  title: string;
  onBackPress?: () => void;
  backAccessibilityLabel?: string;
  onToggleSearch?: () => void;
  isSearchActive?: boolean;
  onOpenVisibility?: () => void;
  onMenuPress?: () => void;
};

const shadowStyle = createShadowStyle({
  native: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBackPress,
  backAccessibilityLabel,
  onToggleSearch,
  isSearchActive,
  onOpenVisibility,
  onMenuPress,
}) => {
  const showBack = typeof onBackPress === 'function';
  const showSearch = typeof onToggleSearch === 'function';
  const menuHandler = onMenuPress ?? onOpenVisibility;
  const showMenu = typeof menuHandler === 'function';
  const searchLabel = isSearchActive ? 'Close search' : 'Open search';
  const backLabel = backAccessibilityLabel ?? 'Go back';

  return (
    <View style={[styles.wrapper, shadowStyle]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {showBack ? (
            <Pressable
              onPress={onBackPress}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              hitSlop={ICON_HIT_SLOP}
            >
              <Feather name="arrow-left" size={ICON_SIZE} color={theme.colors.icon} />
            </Pressable>
          ) : null}

          <View style={[styles.titleWrapper, showBack ? styles.titleWithBack : null]}>
            <GradientTitle text={title} style={styles.title} />
          </View>

          {showSearch || showMenu ? (
            <View style={styles.actions}>
              {showSearch ? (
                <Pressable
                  onPress={onToggleSearch}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
                  accessibilityRole="button"
                  accessibilityLabel={searchLabel}
                  hitSlop={ICON_HIT_SLOP}
                >
                  <Feather name="search" size={ICON_SIZE} color={theme.colors.icon} />
                </Pressable>
              ) : null}

              {showMenu ? (
                <Pressable
                  onPress={() => menuHandler?.()}
                  style={({ pressed }) => [
                    styles.iconButton,
                    showSearch ? styles.iconSpacing : null,
                    pressed && styles.iconPressed,
                  ]}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
                  accessibilityRole="button"
                  accessibilityLabel="Open menu"
                  hitSlop={ICON_HIT_SLOP}
                >
                  <Feather name="menu" size={ICON_SIZE} color={theme.colors.icon} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.headerBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: 10,
  },
  safeArea: {
    backgroundColor: theme.colors.headerBackground,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.header.height,
    paddingHorizontal: theme.header.paddingHorizontal,
    paddingTop: 2,
    paddingBottom: 2,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
  },
  titleWithBack: {
    marginLeft: theme.header.contentSpacing,
  },
  title: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.header.contentSpacing,
  },
  iconButton: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacing: {
    marginLeft: theme.header.contentSpacing,
  },
  iconPressed: {
    opacity: 0.6,
  },
  placeholder: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    marginLeft: theme.header.contentSpacing,
  },
});

export default AppHeader;
