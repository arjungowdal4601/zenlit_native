import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import Navigation from '../../src/components/Navigation';
import ProfileActions from '../../src/components/profile/ProfileActions';
import ProfileAbout from '../../src/components/profile/ProfileAbout';
import ProfileHeader from '../../src/components/profile/ProfileHeader';
import ProfileStats from '../../src/components/profile/ProfileStats';
import SocialLinksRow from '../../src/components/profile/SocialLinksRow';
import { NEARBY_USERS } from '../../src/constants/nearbyUsers';

const DEFAULT_STATS = {
  posts: 54,
  followers: 980,
  following: 120,
};

const UserProfileScreen: React.FC = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = useMemo(() => {
    const value = params.id;
    if (Array.isArray(value)) {
      return value[0];
    }
    return value ?? '';
  }, [params.id]);

  const user = useMemo(() => NEARBY_USERS.find((item) => item.id === userId), [userId]);

  if (!user) {
    return (
      <View style={styles.missingRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <AppHeader title="Profile" />
        </SafeAreaView>
        <View style={styles.missingContent}>
          <Text style={styles.missingText}>User not found.</Text>
        </View>
        <Navigation activePath="/profile" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader title="Profile" />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={user.name}
          username={user.username}
          avatar={user.profilePhoto}
          distance={user.distance}
        />
        <ProfileStats
          posts={DEFAULT_STATS.posts}
          followers={DEFAULT_STATS.followers}
          following={DEFAULT_STATS.following}
        />
        <SocialLinksRow links={user.socialLinks} />
        <ProfileAbout bio={user.bio} />
        <ProfileActions />
      </ScrollView>
      <Navigation activePath="/profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  missingRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  missingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});

export default UserProfileScreen;
