import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { MessageSquare, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import type { NearbyUser } from '../constants/nearbyUsers';
import {
  DEFAULT_VISIBLE_PLATFORMS,
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  getTwitterHandle,
  type SocialLinks,
  type SocialPlatformId,
} from '../constants/socialPlatforms';
import { theme } from '../styles/theme';

type SocialProfileCardProps = {
  user: NearbyUser;
  selectedAccounts?: SocialPlatformId[];
};

const FALLBACK_AVATAR =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const MAX_BIO_LENGTH = 120;

const sanitiseAvatarUrl = (value?: string | null) => {
  const source = value && value.trim() ? value : FALLBACK_AVATAR;
  return source.replace(/["'()]/g, '');
};

const getVisiblePlatforms = (
  links: SocialLinks,
  selected: SocialPlatformId[] | undefined,
): Array<{ id: SocialPlatformId; url: string }> => {
  const active = selected?.length ? selected : DEFAULT_VISIBLE_PLATFORMS;
  const instagram = ensureSocialUrl('instagram', links.instagram);
  const linkedin = ensureSocialUrl('linkedin', links.linkedin);
  const twitterHandle = getTwitterHandle(links);
  const twitter = ensureSocialUrl('twitter', twitterHandle);

  const results: Array<{ id: SocialPlatformId; url: string }> = [];

  if (instagram && active.includes('instagram')) {
    results.push({ id: 'instagram', url: instagram });
  }
  if (linkedin && active.includes('linkedin')) {
    results.push({ id: 'linkedin', url: linkedin });
  }
  if (twitter && active.includes('twitter')) {
    results.push({ id: 'twitter', url: twitter });
  }

  return results;
};

export const SocialProfileCard: React.FC<SocialProfileCardProps> = ({
  user,
  selectedAccounts,
}) => {
  const router = useRouter();
  const displayBio = useMemo(() => {
    return user.bio.length > MAX_BIO_LENGTH
      ? `${user.bio.slice(0, MAX_BIO_LENGTH)}...`
      : user.bio;
  }, [user.bio]);

  const avatarSource = useMemo(() => ({ uri: sanitiseAvatarUrl(user.profilePhoto) }), [user.profilePhoto]);
  const platforms = useMemo(() => getVisiblePlatforms(user.socialLinks, selectedAccounts), [
    selectedAccounts,
    user.socialLinks,
  ]);

  const handleProfilePress = () => {
    router.push(`/profile/${user.id}`);
  };

  const handleMessagePress = () => {
    router.push(`/messages/${user.id}`);
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('Unable to open url', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable style={styles.avatarWrapper} onPress={handleProfilePress}>
          <Image source={avatarSource} style={styles.avatar} />
        </Pressable>

        <View style={styles.topContent}>
          <Pressable onPress={handleProfilePress} style={styles.nameWrapper}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            {user.username ? (
              <Text style={styles.username} numberOfLines={1}>
                @{user.username}
              </Text>
            ) : null}
          </Pressable>

          <Text style={styles.bio} numberOfLines={2}>
            {displayBio}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.socialRow}>
          {platforms.map(({ id, url }) => {
            const meta = SOCIAL_PLATFORMS[id];
            const iconSize = Platform.select({ ios: 18, android: 18, default: 16 }) ?? 18;

            const wrapperStyles = [styles.socialWrapper, meta.wrapperStyle];
            const icon = (
              <FontAwesome name={meta.iconName} size={iconSize} color={id === 'instagram' ? '#ffffff' : '#ffffff'} />
            );

            return (
              <Pressable
                key={id}
                onPress={() => handleLinkPress(url)}
                style={styles.socialButton}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
              >
                {meta.gradient ? (
                  <LinearGradient colors={meta.gradient} style={wrapperStyles as any}>
                    {icon}
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      wrapperStyles,
                      meta.backgroundColor ? { backgroundColor: meta.backgroundColor } : null,
                    ]}
                  >
                    {icon}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleProfilePress} accessibilityRole="button">
            <User size={22} color="#ffffff" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleMessagePress} accessibilityRole="button">
            <MessageSquare size={22} color="#ffffff" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 8 },
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  topContent: {
    flex: 1,
    minWidth: 0,
  },
  nameWrapper: {
    marginBottom: 4,
  },
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    color: '#9ca3af',
    fontSize: 14,
  },
  bio: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialButton: {
    marginRight: 10,
  },
  socialWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    marginLeft: 12,
  },
});

export default SocialProfileCard;
