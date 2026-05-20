import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '../src/utils/logger';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { AppHeader } from '../src/components/AppHeader';
import { SocialProfileCard } from '../src/components/SocialProfileCard';
import VisibilitySheet from '../src/components/VisibilitySheet';
import { useVisibility } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';
import { getNearbyUsers, type NearbyUserData } from '../src/services';
import { supabase } from '../src/lib/supabase';
import { AnimatedStatusView } from '../src/components/AnimatedStatusView';

const SEARCH_DEBOUNCE_DELAY = 120;
const REALTIME_DEBOUNCE_DELAY = 500;

type SearchableUser = {
  user: NearbyUserData;
  lowerName: string;
  lowerUsername: string;
  lowerHandle: string;
};

const RadarScreen: React.FC = () => {
  const {
    selectedAccounts,
    isVisible,
    locationPermissionDenied,
    locationStatus,
    requestLocationPermission,
    setIsVisible,
  } = useVisibility();
  const insets = useSafeAreaInsets();

  const [isSearchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewUsers, setHasNewUsers] = useState(false);
  const [permissionCardDismissed, setPermissionCardDismissed] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const realtimeChannelRef = useRef<any>(null);
  const realtimeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUserIdsRef = useRef<Set<string>>(new Set());

  const loadNearbyUsers = useCallback(async (showSpinner = true) => {
    if (!isVisible || locationPermissionDenied) {
      setNearbyUsers([]);
      setLoading(false);
      setError(null);
      setHasNewUsers(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    }
    setError(null);

    const { users, error: fetchError } = await getNearbyUsers();

    if (fetchError) {
      setError(fetchError.message);
      setNearbyUsers([]);
      setHasNewUsers(false);
    } else {
      const currentUserIds = new Set(users.map(u => u.id));
      const previousUserIds = previousUserIdsRef.current;

      const hasNew = users.some(u => !previousUserIds.has(u.id));
      if (hasNew && previousUserIds.size > 0) {
        setHasNewUsers(true);
      }

      previousUserIdsRef.current = currentUserIds;
      setNearbyUsers(users);
    }

    setLoading(false);
  }, [isVisible, locationPermissionDenied]);

  useEffect(() => {
    loadNearbyUsers(true);
  }, [loadNearbyUsers]);

  useEffect(() => {
    const handleBackPress = () => {
      if (Platform.OS === 'android') {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, []);

  const searchableUsers = useMemo<SearchableUser[]>(
    () =>
      nearbyUsers.map((user) => ({
        user,
        lowerName: user.name.toLowerCase(),
        lowerUsername: user.username.toLowerCase(),
        lowerHandle: `@${user.username.toLowerCase()}`,
      })),
    [nearbyUsers],
  );

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, SEARCH_DEBOUNCE_DELAY);

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
      return nearbyUsers;
    }

    return matchingUsers.map((entry) => entry.user);
  }, [hasQuery, matchingUsers, nearbyUsers]);

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

  const handleTitlePress = useCallback(() => {
    loadNearbyUsers(true);
  }, [loadNearbyUsers]);

  const dismissNewUsersHint = useCallback(() => {
    setHasNewUsers(false);
  }, []);

  const handleEnableLocation = useCallback(async () => {
    if (isRequestingLocation) {
      return;
    }

    setIsRequestingLocation(true);
    try {
      await requestLocationPermission({ autoEnable: true });
      setPermissionCardDismissed(true);
    } finally {
      setIsRequestingLocation(false);
    }
  }, [isRequestingLocation, requestLocationPermission]);

  const handleTurnOnVisibility = useCallback(async () => {
    if (locationStatus === 'success') {
      setIsVisible(true, 'user');
      return;
    }

    await handleEnableLocation();
  }, [handleEnableLocation, locationStatus, setIsVisible]);

  const handleOpenSettings = useCallback(() => {
    if (typeof Linking.openSettings === 'function') {
      void Linking.openSettings();
    }
  }, []);

  useEffect(() => {
    if (!isVisible || locationPermissionDenied) {
      if (realtimeChannelRef.current) {
        logger.debug('RT:Radar', 'Cleaning up realtime subscription (visibility off or permission denied)');
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current);
        realtimeDebounceTimerRef.current = null;
      }
      return;
    }

    logger.debug('RT:Radar', 'Setting up location realtime subscription');

    const handleLocationChange = () => {
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current);
      }

      realtimeDebounceTimerRef.current = setTimeout(() => {
        logger.debug('RT:Radar', 'Location change detected, refreshing nearby users silently');
        loadNearbyUsers(false);
      }, REALTIME_DEBOUNCE_DELAY);
    };

    realtimeChannelRef.current = supabase
      .channel('radar-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          logger.debug('RT:Radar', 'Location INSERT event received');
          handleLocationChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'locations',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          logger.debug('RT:Radar', 'Location UPDATE event received');
          handleLocationChange();
        }
      )
      .subscribe((status: string) => {
        logger.info('RT:Radar', `Location channel status: ${status}`);
      });

    return () => {
      if (realtimeChannelRef.current) {
        logger.debug('RT:Radar', 'Cleaning up realtime subscription');
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current);
        realtimeDebounceTimerRef.current = null;
      }
    };
  }, [isVisible, locationPermissionDenied, loadNearbyUsers]);

  const renderRadarGateCard = ({
    title,
    body,
    primaryLabel,
    secondaryLabel,
    onPrimary,
    onSecondary,
  }: {
    title: string;
    body: string;
    primaryLabel: string;
    secondaryLabel?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  }) => (
    <View style={styles.gateContainer}>
      <View style={styles.gateCard}>
        <Text style={styles.gateTitle}>{title}</Text>
        <Text style={styles.gateBody}>{body}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={onPrimary}
          disabled={isRequestingLocation}
          style={({ pressed }) => [
            styles.gatePrimaryButton,
            pressed && !isRequestingLocation ? styles.gateButtonPressed : null,
            isRequestingLocation ? styles.gateButtonDisabled : null,
          ]}
        >
          <LinearGradient
            colors={['#2563eb', '#7e22ce']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gatePrimaryGradient}
          >
            {isRequestingLocation ? (
              <View style={styles.gateLoadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={[styles.gatePrimaryLabel, styles.gateLoadingLabel]}>
                  Checking...
                </Text>
              </View>
            ) : (
              <Text style={styles.gatePrimaryLabel}>{primaryLabel}</Text>
            )}
          </LinearGradient>
        </Pressable>

        {secondaryLabel && onSecondary ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSecondary}
            disabled={isRequestingLocation}
            style={({ pressed }) => [
              styles.gateSecondaryButton,
              pressed && !isRequestingLocation ? styles.gateButtonPressed : null,
            ]}
          >
            <Text style={styles.gateSecondaryLabel}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const shouldShowInitialPermissionCard =
    !isVisible &&
    !locationPermissionDenied &&
    locationStatus === 'not-attempted' &&
    !permissionCardDismissed;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <AppHeader
        title="Radar"
        onTitlePress={handleTitlePress}
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

      {hasNewUsers && !isSearchOpen && isVisible && !locationPermissionDenied && !loading && !error ? (
        <View style={styles.newUsersHint}>
          <Text style={styles.newUsersText}>New people nearby</Text>
          <Text
            style={styles.dismissHint}
            onPress={dismissNewUsersHint}
            accessibilityLabel="Dismiss notification"
          >
            Dismiss
          </Text>
        </View>
      ) : null}

      {shouldShowInitialPermissionCard ? (
        renderRadarGateCard({
          title: 'Share your location to discover people nearby.',
          body: 'Zenlit uses your location to show people around you. You control your visibility.',
          primaryLabel: 'Enable location',
          secondaryLabel: 'Not now',
          onPrimary: handleEnableLocation,
          onSecondary: () => setPermissionCardDismissed(true),
        })
      ) : locationPermissionDenied ? (
        renderRadarGateCard({
          title: 'Location permission is off',
          body: 'Location is needed for nearby discovery. You can retry or open settings to allow access.',
          primaryLabel: 'Retry location',
          secondaryLabel: 'Open settings',
          onPrimary: handleEnableLocation,
          onSecondary: handleOpenSettings,
        })
      ) : !isVisible ? (
        renderRadarGateCard({
          title: 'Radar visibility is off',
          body: 'Turn it on to appear on Radar and see nearby users.',
          primaryLabel: 'Turn on visibility',
          onPrimary: handleTurnOnVisibility,
        })
      ) : loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Finding nearby users...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error loading nearby users</Text>
          <Text style={styles.errorDetail}>We could not load nearby people right now. Please try again.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => loadNearbyUsers(true)}
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.gateButtonPressed : null,
            ]}
          >
            <Text style={styles.retryButtonLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : (
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
            flexGrow: 1,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: 160 + Math.max(insets.bottom, 12),
            paddingTop: theme.spacing.sm,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            hasQuery ? (
              <AnimatedStatusView
                title="No users found"
                subtitle="Try different keywords"
                icon="search"
              />
            ) : (
              <AnimatedStatusView
                title="No nearby users"
                subtitle="No one is visible"
                icon="users"
              />
            )
          }
        />
      )}

      {/* Navigation is now rendered in the root layout */}

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  gateCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  gateTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
  gateBody: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  gatePrimaryButton: {
    marginTop: 22,
    minHeight: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gatePrimaryGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatePrimaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  gateSecondaryButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateSecondaryLabel: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '700',
  },
  gateLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateLoadingLabel: {
    marginLeft: 8,
  },
  gateButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  gateButtonDisabled: {
    opacity: 0.7,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonLabel: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '700',
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningDetail: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
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
    textAlign: 'center',
  },
  newUsersHint: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newUsersText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '500',
  },
  dismissHint: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
  },
});

export default RadarScreen;
