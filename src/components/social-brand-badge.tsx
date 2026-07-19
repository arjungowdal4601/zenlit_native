import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import {
  SOCIAL_PLATFORMS,
  type SocialPlatformId,
} from '../constants/socialPlatforms';

const BRAND_ASSETS: Record<SocialPlatformId, ImageSourcePropType> = {
  instagram: require('../../assets/social/instagram-glyph-gradient.png'),
  linkedin: require('../../assets/social/linkedin-in-blue.png'),
  twitter: require('../../assets/social/x-logo-white.png'),
};

const MARK_SCALE: Record<SocialPlatformId, number> = {
  instagram: 0.72,
  linkedin: 0.78,
  twitter: 0.64,
};

const BADGE_BACKGROUND: Record<SocialPlatformId, string> = {
  instagram: '#080d10',
  linkedin: '#080d10',
  twitter: '#000000',
};

type SocialBrandBadgeProps = {
  platform: SocialPlatformId;
  size?: number;
  disabled?: boolean;
  testID?: string;
};

export function SocialBrandBadge({
  platform,
  size = 32,
  disabled = false,
  testID,
}: SocialBrandBadgeProps) {
  const label = SOCIAL_PLATFORMS[platform].label;
  const markSize = Math.round(size * MARK_SCALE[platform]);

  return (
    <View
      accessible
      accessibilityLabel={`${label} logo`}
      accessibilityRole="image"
      testID={testID ?? `social-brand-badge-${platform}`}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size / 4),
          backgroundColor: BADGE_BACKGROUND[platform],
        },
        disabled ? styles.disabled : null,
      ]}
    >
      <Image
        accessible={false}
        resizeMode="contain"
        source={BRAND_ASSETS[platform]}
        style={{ width: markSize, height: markSize }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.35,
  },
});
