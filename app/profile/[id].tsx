import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import Navigation from '../../src/components/Navigation';
import Post from '../../src/components/Post';
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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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

  const headerTitle = (displayUser.name?.trim().length ? displayUser.name : 'Profile');

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

  const initialPosts = useMemo(() =>
    mockPosts.map<MockPost>((post) => ({
      ...post,
      authorName: displayUser.name,
      authorHandle: displayUser.handle,
    })),
    [displayUser.handle, displayUser.name],
  );

  const [posts, setPosts] = useState<MockPost[]>(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handleDeletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: MockPost }) => {
      const feedPost = {
        id: item.id,
        author: {
          name: item.authorName,
          username: item.authorHandle,
          avatar: displayUser.avatar,
          socialLinks: {
            instagram: displayUser.socials.instagram,
            linkedin: displayUser.socials.linkedin,
            twitter: displayUser.socials.x,
          },
        },
        content: item.text,
        image: item.image ?? undefined,
        timestamp: formatDate(item.dateISO),
      };

      return <Post post={feedPost} showSocialLinks={false} />;
    },
    [displayUser.avatar, displayUser.socials],
  );

  const activePath = `/profile/${requestedId.length > 0 ? requestedId : displayUser.id}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader
        title={headerTitle}
        onBackPress={() => router.back()}
        backAccessibilityLabel="Go back"
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.bannerWrapper}>
              <Image source={bannerSource} style={styles.bannerImage} />
              <View style={styles.bannerGradient} />
              <View style={styles.bannerOverlayRow}>
                <View style={styles.avatarWrapper}>
                  <Image source={avatarSource} style={styles.avatar} />
                </View>
                <View style={styles.socialCluster}>
                  {socialEntries.map(({ id, url, disabled }) => {
                    const meta = SOCIAL_PLATFORMS[id];

                    if (id === 'instagram') {
                      return (
                        <Pressable
                          key={id}
                          onPress={() => {
                            if (disabled || !url) return;
                            console.log('Open social link', id, url);
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
                          if (disabled || !url) return;
                          console.log('Open social link', id, url);
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
              </View>
            </View>

            <View style={styles.identityBlock}>
              <Text style={styles.name}>{displayUser.name}</Text>
              <Text style={styles.handle}>@{displayUser.handle}</Text>
            </View>

            <Text style={styles.bio}>{displayUser.bio}</Text>

            <View style={{ marginLeft: -24, marginRight: -24, marginTop: 6 }}>
              <View style={styles.divider} />
            </View>

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
  listContent: {
    // Match feed list padding for consistent post indentation
    paddingHorizontal: 24,
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
    // Align banner to edges relative to list padding
    marginHorizontal: -24,
    marginBottom: 72,
  },
  bannerImage: {
    width: '100%',
    height: 212,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  bannerOverlayRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: -60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#000000',
    padding: 2,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  socialCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Move social icons up by 5px (remove previous downward offset)
    transform: [{ translateX: 5 }, { translateY: 0 }],
  },
  socialButton: {
    borderRadius: 8,
  },
  socialBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    opacity: 0.35,
  },
  identityBlock: {
    // Move name and username up by 10px
    marginTop: 0,
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
    // Move bio up by 10px
    marginTop: 2,
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    marginTop: 6,
    // Make header divider full-bleed like feed separators
    marginLeft: -24,
    marginRight: -24,
    width: '100%',
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
