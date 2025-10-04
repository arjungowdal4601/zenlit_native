import React, { useMemo } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Navigation from '../../src/components/Navigation';
import ProfilePost from '../../src/components/profile/Post';
import {
  mockPosts,
  mockUser,
  type MockPost,
} from '../../src/constants/profileMock';
import {
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  type SocialPlatformId,
} from '../../src/constants/socialPlatforms';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80';
const FALLBACK_AVATAR =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const INSTAGRAM_GRADIENT = [
  '#f09433',
  '#e6683c',
  '#dc2743',
  '#cc2366',
  '#bc1888',
] as const;

const SOCIAL_ORDER: Array<{ id: SocialPlatformId; key: 'instagram' | 'linkedin' | 'x' }> = [
  { id: 'instagram', key: 'instagram' },
  { id: 'linkedin', key: 'linkedin' },
  { id: 'twitter', key: 'x' },
];

const resolveImageSource = (uri?: string | null, fallback?: string): ImageSourcePropType => {
  if (uri && uri.trim().length > 0) {
    return { uri };
  }
  if (fallback) {
    return { uri: fallback };
  }
  return { uri: FALLBACK_AVATAR };
};

const normaliseRequestedId = (raw: string | undefined) => (raw ?? '').trim();

const deriveHandle = (rawId: string): string => {
  const base = rawId.replace(/^@/, '');
  if (/^\d+$/.test(base)) {
    return `user${base}`;
  }
  return base.length > 0 ? base : mockUser.handle;
};

const UserProfileScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const requestedId = useMemo(() => {
    const value = params.id;
    const asString = Array.isArray(value) ? value[0] : value;
    return normaliseRequestedId(asString);
  }, [params.id]);

  const displayUser = useMemo(() => {
    if (
      requestedId.length === 0 ||
      requestedId === mockUser.id ||
      requestedId === mockUser.handle
    ) {
      return mockUser;
    }

    return {
      ...mockUser,
      id: requestedId,
      handle: deriveHandle(requestedId),
    };
  }, [requestedId]);

  const bannerSource = resolveImageSource(displayUser.banner, FALLBACK_BANNER);
  const avatarSource = resolveImageSource(displayUser.avatar, FALLBACK_AVATAR);

  const socialEntries = useMemo(() => {
    return SOCIAL_ORDER.map(({ id, key }) => {
      const handle = displayUser.socials[key];
      const url = ensureSocialUrl(id, handle);
      return {
        id,
        url,
        disabled: !url,
      };
    });
  }, [displayUser.socials]);

  const posts = useMemo(() => {
    return mockPosts.map<MockPost>((post) => ({
      ...post,
      authorName: displayUser.name,
      authorHandle: displayUser.handle,
    }));
  }, [displayUser.handle, displayUser.name]);

  const renderPost = ({ item }: { item: MockPost }) => (
    <ProfilePost
      authorName={item.authorName}
      authorHandle={item.authorHandle}
      dateISO={item.dateISO}
      text={item.text}
      image={item.image}
      avatar={displayUser.avatar}
    />
  );

  const activePath = `/profile/${requestedId.length > 0 ? requestedId : displayUser.id}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#e2e8f0" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.bannerWrapper}>
              <Image source={bannerSource} style={styles.bannerImage} />
              <View style={styles.bannerGradient} />
              <View style={styles.socialCluster}>
                {socialEntries.map(({ id, url, disabled }) => {
                  const meta = SOCIAL_PLATFORMS[id];

                  if (id === 'instagram') {
                    return (
                      <Pressable
                        key={id}
                        onPress={() => {
                          console.log('Open social link', id, url ?? '(missing)');
                        }}
                        disabled={disabled}
                        style={styles.socialButton}
                        accessibilityRole="button"
                        accessibilityLabel={meta.label}
                      >
                        <LinearGradient
                          colors={INSTAGRAM_GRADIENT}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.socialBadge, disabled ? styles.socialDisabled : null]}
                        >
                          {meta.renderIcon({ size: 18, color: '#ffffff' })}
                        </LinearGradient>
                      </Pressable>
                    );
                  }

                  const badgeStyle: StyleProp<ViewStyle> = [
                    styles.socialBadge,
                    id === 'twitter' ? styles.outlinedBadge : null,
                    id !== 'twitter' && meta.style.backgroundColor
                      ? { backgroundColor: meta.style.backgroundColor }
                      : null,
                    disabled ? styles.socialDisabled : null,
                  ];

                  return (
                    <Pressable
                      key={id}
                      onPress={() => {
                        console.log('Open social link', id, url ?? '(missing)');
                      }}
                      disabled={disabled}
                      style={styles.socialButton}
                      accessibilityRole="button"
                      accessibilityLabel={meta.label}
                    >
                      <View style={badgeStyle}>
                        {meta.renderIcon({ size: 18, color: '#ffffff' })}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.avatarWrapper}>
                <Image source={avatarSource} style={styles.avatar} />
              </View>
            </View>

            <View style={styles.identityBlock}>
              <Text style={styles.name}>{displayUser.name}</Text>
              <Text style={styles.handle}>@{displayUser.handle}</Text>
            </View>

            <Text style={styles.bio}>{displayUser.bio}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyState}>No posts yet</Text>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <Navigation activePath={activePath} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    backgroundColor: '#000000',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
    backgroundColor: '#020617',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  headerTitle: {
    color: '#f5f3ff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 18,
  },
  listHeader: {
    gap: 18,
    paddingTop: 16,
  },
  bannerWrapper: {
    position: 'relative',
    backgroundColor: '#111827',
    marginHorizontal: -20,
    marginBottom: 52,
  },
  bannerImage: {
    width: '100%',
    height: 212,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  socialCluster: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    borderRadius: 16,
  },
  socialBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.82)',
  },
  outlinedBadge: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  socialDisabled: {
    opacity: 0.4,
  },
  avatarWrapper: {
    position: 'absolute',
    left: 24,
    bottom: -34,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#000000',
    padding: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: '#0f172a',
  },
  identityBlock: {
    marginTop: 12,
  },
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  handle: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 15,
  },
  bio: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 24,
  },
});

export default UserProfileScreen;
