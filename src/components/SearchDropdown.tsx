import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import { createShadowStyle } from '../utils/shadow';

export type SearchDropdownItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type SearchDropdownProps = {
  visible: boolean;
  query: string;
  onChangeQuery: (text: string) => void;
  onRequestClose: () => void;
  onSelect: (item: SearchDropdownItem) => void;
  items: SearchDropdownItem[];
  topOffset?: number;
  horizontalPadding?: number;
};

const dropdownShadow = createShadowStyle({
  native: {
    shadowColor: '#020617',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
});

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  visible,
  query,
  onChangeQuery,
  onRequestClose,
  onSelect,
  items,
  topOffset = 0,
  horizontalPadding = theme.spacing.lg,
}) => {
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      setRendered(true);
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (!visible && finished) {
        setRendered(false);
      }
    });
  }, [progress, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [visible]);

  if (!rendered) {
    return null;
  }

  const handleClose = () => {
    onChangeQuery('');
    onRequestClose();
  };

  const hasQuery = query.trim().length > 0;
  const maxListHeight = Math.round(windowHeight * 0.48);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <Animated.View
        style={[
          styles.dropdown,
          dropdownShadow,
          {
            top: topOffset,
            left: horizontalPadding,
            right: horizontalPadding,
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onChangeQuery}
            placeholder='Search users...'
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            returnKeyType='search'
            accessibilityLabel='Search users'
            autoCorrect={false}
            spellCheck={false}
            keyboardAppearance='dark'
          />

          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
            accessibilityLabel='Close search'
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather name='x' size={18} color={theme.colors.icon} />
          </Pressable>
        </View>

        {hasQuery ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps='handled'
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={{ maxHeight: maxListHeight }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.item,
                  pressed ? styles.itemPressed : null,
                ]}
                accessibilityRole='button'
                accessibilityLabel={`Select ${item.title}`}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>
                  Try a different name or handle.
                </Text>
              </View>
            }
          />
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    pointerEvents: 'box-none' as const,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    zIndex: 32,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  input: {
    height: 44,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xl + theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  listContent: {
    paddingVertical: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
  },
  item: {
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  itemPressed: {
    backgroundColor: 'rgba(30, 41, 59, 0.22)',
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    marginTop: 2,
    color: theme.colors.muted,
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 4,
    color: theme.colors.muted,
    fontSize: 13,
  },
});

export default SearchDropdown;
