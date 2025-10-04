import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import type { NearbyUser, SocialLinks, SocialPlatformId } from '../constants/nearbyUsers';
import { socialPlatforms } from '../constants/socialPlatforms';
import { theme } from '../styles/theme';

type SocialProfileCardProps = {
  user: NearbyUser;
  visiblePlatforms?: SocialPlatformId[];
  onProfilePress?: (userId: string) => void;
  onMessagePress?: (userId: string) => void;
  onSocialPress?: (platformId: SocialPlatformId, url: string) => void;
};

const filterLinks = (links: SocialLinks, visiblePlatforms?: SocialPlatformId[]) => {
  if (!visiblePlatforms || visiblePlatforms.length === 0) {
    return [] as Array<[SocialPlatformId, string]>;
  }

  return (Object.entries(links) as Array<[SocialPlatformId, string]>).filter(
    (entry): entry is [SocialPlatformId, string] =>
      Boolean(entry[1]) && visiblePlatforms.includes(entry[0])
  );
};

export const SocialProfileCard: React.FC<SocialProfileCardProps> = ({
  user,
  visiblePlatforms,
  onProfilePress,
  onMessagePress,
  onSocialPress,
}) => {
  const platforms = useMemo(
    () => (visiblePlatforms ? filterLinks(user.links, visiblePlatforms) : Object.entries(user.links) as Array<[SocialPlatformId, string]>),
    [user.links, visiblePlatforms]
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            {user.handle}
          </Text>
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>

          <View style={styles.footer}>
            <View style={styles.socialRow}>
              {platforms.map(([platformId, url]) => {
                const platform = socialPlatforms[platformId];
                const content = platform.renderIcon({ color: '#FFFFFF', size: theme.iconSizes.md });

                return (
                  <Pressable
                    key={platformId}
                    style={styles.socialButton}
                    onPress={() => onSocialPress?.(platformId, url)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${platform.label}`}
                  >
                    {platform.gradient ? (
                      <LinearGradient colors={platform.gradient} style={styles.socialIcon}>
                        {content}
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.socialIcon,
                          platform.backgroundColor ? { backgroundColor: platform.backgroundColor } : null,
                        ]}
                      >
                        {content}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => onProfilePress?.(user.id)}
                accessibilityRole="button"
                accessibilityLabel="View profile"
              >
                <Feather name="user" size={theme.iconSizes.md} color={theme.colors.icon} />
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.actionSpacing]}
                onPress={() => onMessagePress?.(user.id)}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Feather name="message-circle" size={theme.iconSizes.md} color={theme.colors.icon} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: theme.shadows.card.shadowColor,
        shadowOpacity: theme.shadows.card.shadowOpacity,
        shadowRadius: theme.shadows.card.shadowRadius,
        shadowOffset: theme.shadows.card.shadowOffset,
      },
      android: {
        elevation: theme.shadows.card.elevation,
      },
      default: {
        shadowColor: theme.shadows.card.shadowColor,
        shadowOpacity: theme.shadows.card.shadowOpacity,
        shadowRadius: theme.shadows.card.shadowRadius,
        shadowOffset: theme.shadows.card.shadowOffset,
      },
    }),
  },
  content: {
    flexDirection: 'row',
  },
  avatar: {
    width: theme.avatar.size,
    height: theme.avatar.size,
    borderRadius: theme.avatar.size / 2,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.muted,
  },
  details: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.title.size,
    fontWeight: theme.typography.title.weight,
    lineHeight: theme.typography.title.lineHeight,
  },
  handle: {
    color: theme.typography.handle.color,
    fontSize: theme.typography.handle.size,
    fontWeight: theme.typography.handle.weight,
    marginTop: 2,
  },
  bio: {
    color: theme.typography.body.color,
    fontSize: theme.typography.body.size,
    fontWeight: theme.typography.body.weight,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialButton: {
    marginRight: theme.spacing.xs,
  },
  socialIcon: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  actionSpacing: {
    marginLeft: theme.spacing.xs,
  },
});
