import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import Navigation from '../../src/components/Navigation';
import LogoutConfirmation from '../../src/components/LogoutConfirmation';
import ProfileMenu from '../../src/components/profile/ProfileMenu';
import {
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  getTwitterHandle,
} from '../../src/constants/socialPlatforms';
import { NEARBY_USERS } from '../../src/constants/nearbyUsers';

const ME = NEARBY_USERS[0];

const SOCIAL_ORDER: Array<'instagram' | 'linkedin' | 'twitter'> = [
  'instagram',
  'linkedin',
  'twitter',
];

const FALLBACK_BANNER_URI =
  'https://images.unsplash.com/photo-1519669556878-619358287bf8?auto=format&fit=crop&w=1200&q=80';
const bannerImg = require('@/assets/images/profile-banner.jpg');

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
  }, []);

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
    router.replace('/');
  }, [router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => setMenuOpen(true)}
            accessibilityRole='button'
            accessibilityLabel='Open profile menu'>
            <Feather name="menu" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          <Image
            source={bannerSource}
            style={styles.bannerImage}
            resizeMode='cover'
          />
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: ME.profilePhoto }} style={styles.avatar} />
          </View>
        </View>

        <View style={styles.profileContent}>
          <View style={styles.socialRow}>
            {socialEntries.map(({ id, url }) => {
              const meta = SOCIAL_PLATFORMS[id];
              const icon = meta.renderIcon({ size: 18, color: '#ffffff' });
              const disabled = !url;
              return (
                <Pressable
                  key={id}
                  style={[styles.socialButton, disabled ? styles.socialDisabled : null]}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  onPress={() => {
                    if (!url) {
                      return;
                    }
                    console.log('social link', id, url);
                }}
              >
                {id === 'instagram' ? (
                  <LinearGradient
                    colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.socialBadge}
                  >
                    {icon}
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.socialBadge,
                      meta.style.backgroundColor
                        ? { backgroundColor: meta.style.backgroundColor }
                        : null,
                    ]}
                  >
                    {icon}
                  </View>
                )}
              </Pressable>
            );
          })}
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
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Feather name="file-text" size={24} color="#64748b" />
          </View>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Share your first post to get started!</Text>
        </View>
        </View>
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
  safeArea: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6d28d9',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  content: {
    paddingBottom: 160,
  },
  bannerWrapper: {
    position: 'relative',
    marginBottom: 60,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 0,
  },
  avatarWrapper: {
    position: 'absolute',
    left: 20,
    bottom: -50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 2,
    backgroundColor: '#000000',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  profileContent: {
    paddingHorizontal: 20,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  socialButton: {
    borderRadius: 12,
  },
  socialDisabled: {
    opacity: 0.4,
  },
  socialBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBlock: {
    marginBottom: 16,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
});

export default ProfileScreen;

