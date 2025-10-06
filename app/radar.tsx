import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/AppHeader';
import Navigation from '../src/components/Navigation';
import { SocialProfileCard } from '../src/components/SocialProfileCard';
import VisibilitySheet from '../src/components/VisibilitySheet';
import { NEARBY_USERS } from '../src/constants/nearbyUsers';
import { useVisibility } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';

const DEBOUNCE_DELAY = 120;

type SearchableUser = {
  user: (typeof NEARBY_USERS)[number];
  lowerName: string;
  lowerUsername: string;
  lowerHandle: string;
};

const RadarScreen: React.FC = () => {
  const { selectedAccounts } = useVisibility();
  const insets = useSafeAreaInsets();

  const [isSearchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSheetVisible, setSheetVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const searchableUsers = useMemo<SearchableUser[]>(
    () =>
      NEARBY_USERS.map((user) => ({
        user,
        lowerName: user.name.toLowerCase(),
        lowerUsername: user.username.toLowerCase(),
        lowerHandle: `@${user.username.toLowerCase()}`,
      })),
    [],
  );

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const normalizedQuery = debouncedQuery.toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const matchingUsers = useMemo(() => {
    if (!hasQuery) {
      return searchableUsers;
    }

    return searchableUsers.filter((entry) => {
      if (entry.lowerName.includes(normalizedQuery)) {
        return true;
      }
      if (entry.lowerUsername.includes(normalizedQuery)) {
        return true;
      }
      return entry.lowerHandle.includes(normalizedQuery);
    });
  }, [hasQuery, normalizedQuery, searchableUsers]);

  const filteredUsers = useMemo(() => {
    if (!hasQuery) {
      return NEARBY_USERS;
    }

    return matchingUsers.map((entry) => entry.user);
  }, [hasQuery, matchingUsers]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const handleToggleSearch = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
    } else {
      setQuery('');
      setDebouncedQuery('');
      setSearchOpen(true);
    }
  }, [closeSearch, isSearchOpen]);

  const handleOpenVisibility = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
    }
    setSheetVisible(true);
  }, [closeSearch, isSearchOpen]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <AppHeader
        title="Radar"
        onToggleSearch={handleToggleSearch}
        isSearchActive={isSearchOpen}
        onOpenVisibility={handleOpenVisibility}
      />

      {isSearchOpen ? (
        <View style={styles.searchContainer}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search users..."
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search users"
            autoCorrect={false}
            spellCheck={false}
            keyboardAppearance="dark"
          />
        </View>
      ) : null}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SocialProfileCard
            user={item}
            selectedAccounts={selectedAccounts}
            borderRadius={10}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 160 + Math.max(insets.bottom, 12),
          paddingTop: theme.spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          hasQuery ? (
            <View style={styles.listEmpty}>
              <Text style={styles.listEmptyTitle}>No users found</Text>
              <Text style={styles.listEmptySubtitle}>
                Try a different name or handle.
              </Text>
            </View>
          ) : null
        }
      />

      <Navigation activePath="/radar" />

      <VisibilitySheet
        visible={isSheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  searchInput: {
    height: 44,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  listEmpty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  listEmptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listEmptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 6,
  },
});

export default RadarScreen;
