import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/AppHeader';
import { Navigation } from '../src/components/Navigation';
import { SearchDropdown } from '../src/components/SearchDropdown';
import { SocialProfileCard } from '../src/components/SocialProfileCard';
import { VisibilitySheet } from '../src/components/VisibilitySheet';
import { nearbyUsers } from '../src/constants/nearbyUsers';
import { useVisibility } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';

const RadarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isSheetVisible, setSheetVisible] = useState(false);
  const { isVisible, selectedPlatforms } = useVisibility();

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) {
      return nearbyUsers;
    }

    return nearbyUsers.filter((user) => {
      const nameMatch = user.name.toLowerCase().includes(normalizedQuery);
      const handleMatch = user.handle.toLowerCase().includes(normalizedQuery);
      return nameMatch || handleMatch;
    });
  }, [normalizedQuery]);

  const suggestions = useMemo(
    () =>
      nearbyUsers
        .filter((user) => {
          if (!normalizedQuery) {
            return true;
          }
          const nameMatch = user.name.toLowerCase().includes(normalizedQuery);
          const handleMatch = user.handle.toLowerCase().includes(normalizedQuery);
          return nameMatch || handleMatch;
        })
        .map((user) => ({ id: user.id, title: user.name, subtitle: user.handle })),
    [normalizedQuery]
  );

  const activePlatforms = selectedPlatforms.length > 0 ? selectedPlatforms : undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader
          title="Radar"
          onSearchPress={() => setDropdownVisible((value) => !value)}
          onMenuPress={() => setSheetVisible(true)}
        />
      </SafeAreaView>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!isVisible ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>You are currently hidden</Text>
              <Text style={styles.bannerSubtitle}>
                Turn visibility back on to let nearby people discover you.
              </Text>
            </View>
          ) : null}

          {filteredUsers.map((user) => (
            <View key={user.id} style={!isVisible ? styles.dimmedCard : undefined}>
              <SocialProfileCard
                user={user}
                visiblePlatforms={activePlatforms}
                onProfilePress={(userId) => console.log('profile', userId)}
                onMessagePress={(userId) => console.log('message', userId)}
                onSocialPress={(platformId, url) => console.log('social', platformId, url)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.navigationContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        <Navigation activeTab="radar" onTabPress={(tab) => console.log('tab', tab)} />
      </View>

      <SearchDropdown
        visible={isDropdownVisible}
        query={query}
        suggestions={suggestions}
        onQueryChange={(value) => {
          setQuery(value);
          if (!isDropdownVisible) {
            setDropdownVisible(true);
          }
        }}
        onSelect={(item) => {
          setQuery(item.title);
          setDropdownVisible(false);
        }}
        onDismiss={() => setDropdownVisible(false)}
      />

      <VisibilitySheet visible={isSheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + 80,
  },
  navigationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  banner: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  bannerTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  bannerSubtitle: {
    marginTop: 4,
    color: theme.colors.subtitle,
    fontSize: 13,
  },
  dimmedCard: {
    opacity: 0.45,
  },
});

export default RadarScreen;
