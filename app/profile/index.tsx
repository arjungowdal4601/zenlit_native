import React, { useCallback, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import Navigation from '../../src/components/Navigation';
import LogoutConfirmation from '../../src/components/LogoutConfirmation';
import ProfileMenu from '../../src/components/profile/ProfileMenu';
import Post from '../../src/components/Post';
import {
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  getTwitterHandle,
} from '../../src/constants/socialPlatforms';
import { NEARBY_USERS } from '../../src/constants/nearbyUsers';
import { mockPosts } from '../../src/constants/profileMock';

const ME = NEARBY_USERS[0];

const SOCIAL_ORDER: Array<'instagram' | 'linkedin' | 'twitter'> = [
  'instagram',
  'linkedin',
  'twitter',
];

const FALLBACK_BANNER_URI =
  'https://images.unsplash.com/photo-1519669556878-619358287bf8?auto=format&fit=crop&w=1200&q=80';
const bannerImg = require('@/assets/images/profile-banner.jpg');

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

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const socialEntries = useMemo(() => {
    if (!ME.socialLinks) {
      return [];
    }
    return SOCIAL_ORDER.map((id) => {
      if (id === 'instagram') {
        const url = ensureSocialUrl('instagram', ME.socialLinks?.instagram);
        return { id, url: url ?? null } as const;
      }
      if (id === 'linkedin') {
        const url = ensureSocialUrl('linkedin', ME.socialLinks?.linkedin);
        return { id, url: url ?? null } as const;
      }
      const handle = getTwitterHandle(ME.socialLinks);
      const url = ensureSocialUrl('twitter', handle);
      return { id, url: url ?? null } as const;
    });
  }, []);

  const bannerSource: ImageSourcePropType = bannerImg || { uri: FALLBACK_BANNER_URI };

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleEditProfile = useCallback(() => {
    setMenuOpen(false);
    router.push('/edit-profile');
  }, [router]);

  const handleFeedback = useCallback(() => {
    setMenuOpen(false);
    router.push('/feedback');
  }, [router]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    setLogoutOpen(true);
  }, []);

  const handleCancelLogout = useCallback(() => {
    setLogoutOpen(false);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    setLogoutOpen(false);
    router.replace('/auth/signin');
  }, [router]);

  const [posts, setPosts] = useState(mockPosts);

  const handleDeletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: { id: string; dateISO: string; text: string; image?: string } }) => {
      const feedPost = {
        id: item.id,
        author: {
          name: ME.name,
          username: ME.username,
          avatar: ME.profilePhoto,
          socialLinks: ME.socialLinks,
        },
        content: item.text,
        image: item.image ?? undefined,
        timestamp: formatDate(item.dateISO),
      };

      return <Post post={feedPost} showSocialLinks={false} showMenu onDelete={handleDeletePost} />;
    },
    [handleDeletePost],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Profile" onMenuPress={() => setMenuOpen(true)} />
      <ProfileMenu
        visible={menuOpen}
        onClose={handleCloseMenu}
        onEditProfile={handleEditProfile}
        onFeedback={handleFeedback}
        onLogout={handleLogout}
      />
      <LogoutConfirmation
        visible={logoutOpen}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.bannerWrapper}>
              <Image source={bannerSource} style={styles.bannerImage} resizeMode="cover" />
              <View style={styles.bannerGradient} />
              <View style={styles.bannerOverlayRow}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: ME.profilePhoto }} style={styles.avatar} />
                </View>
                <View style={styles.socialCluster}>
                  {socialEntries.map(({ id, url }) => {
                    const meta = SOCIAL_PLATFORMS[id];
                    const disabled = !url;

                    if (id === 'instagram') {
                      return (
                        <Pressable
                          key={id}
                          style={styles.socialButton}
                          accessibilityRole="button"
                          accessibilityLabel={meta.label}
                          onPress={() => {
                            if (!url) return;
                            console.log('social link', id, url);
                          }}
                          disabled={disabled}
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
                        style={styles.socialButton}
                        accessibilityRole="button"
                        accessibilityLabel={meta.label}
                        onPress={() => {
                          if (!url) return;
                          console.log('social link', id, url);
                        }}
                        disabled={disabled}
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
              <Text style={styles.name}>{ME.name}</Text>
              <Text style={styles.username}>@{ME.username}</Text>
            </View>

            <View style={styles.bioBlock}>
              <Text style={styles.bioText}>{ME.bio}</Text>
            </View>

            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      <Navigation activePath="/profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
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
    transform: [{ translateX: 5 }, { translateY: 0 }],
  },
  socialButton: {
    borderRadius: 8,
  },
  socialDisabled: {
    opacity: 0.35,
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
  identityBlock: {
    marginBottom: 16,
    marginTop: 0,
  },
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 15,
  },
  bioBlock: {
    marginBottom: 24,
  },
  bioText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    marginTop: 6,
    marginBottom: 12,
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
});

export default ProfileScreen;