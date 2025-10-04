import React, { useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { animations } from '../styles/animations';
import { theme } from '../styles/theme';

type SearchSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
};

type SearchDropdownProps = {
  visible: boolean;
  query: string;
  suggestions: SearchSuggestion[];
  onQueryChange: (value: string) => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  onDismiss: () => void;
};

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  visible,
  query,
  suggestions,
  onQueryChange,
  onSelect,
  onDismiss,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: animations.durations.dropdown,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <Animated.View style={[styles.dropdown, { opacity }]}> 
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search people"
          placeholderTextColor={theme.colors.subtitle}
          style={styles.input}
          autoFocus
        />
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>Try a different name or handle.</Text>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    top: 94,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.dropdown,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    height: 44,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.muted,
    color: theme.colors.text,
    fontSize: 16,
  },
  item: {
    paddingVertical: theme.spacing.sm,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    marginTop: 2,
    color: theme.colors.subtitle,
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  emptyState: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.subtitle,
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: theme.colors.subtitle,
    fontSize: 12,
    marginTop: 4,
  },
});
