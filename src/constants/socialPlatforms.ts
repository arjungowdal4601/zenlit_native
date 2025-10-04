import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type SocialPlatformId = 'instagram' | 'linkedin' | 'twitter';

export type SocialLinks = {
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  x_twitter?: string | null;
};

export const getTwitterHandle = (links?: SocialLinks | null) => {
  if (!links) {
    return null;
  }

  return links.twitter ?? links.x_twitter ?? null;
};

type IconRenderProps = {
  size: number;
  color: string;
};

export type SocialPlatformMeta = {
  id: SocialPlatformId;
  label: string;
  gradient?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  backgroundColor?: ColorValue;
  wrapperStyle: StyleProp<ViewStyle>;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
};

export const SOCIAL_PLATFORMS: Record<SocialPlatformId, SocialPlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    gradient: [
      '#f09433',
      '#e6683c',
      '#dc2743',
      '#cc2366',
      '#bc1888',
    ] as const,
    wrapperStyle: {
      borderRadius: 12,
    },
    iconName: 'instagram',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    backgroundColor: '#0077B5',
    wrapperStyle: {
      borderRadius: 6,
    },
    iconName: 'linkedin',
  },
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    backgroundColor: '#000000',
    wrapperStyle: {
      borderRadius: 6,
    },
    iconName: 'twitter',
  },
};

export const SOCIAL_PLATFORM_IDS: SocialPlatformId[] = Object.keys(SOCIAL_PLATFORMS) as SocialPlatformId[];

export const DEFAULT_VISIBLE_PLATFORMS: SocialPlatformId[] = [...SOCIAL_PLATFORM_IDS];

const SOCIAL_URL_BASE: Record<SocialPlatformId, string> = {
  instagram: 'https://instagram.com/',
  linkedin: 'https://linkedin.com/in/',
  twitter: 'https://x.com/',
};

const HAS_PROTOCOL = /^https?:\/\//i;

export const ensureSocialUrl = (
  platform: SocialPlatformId,
  value?: string | null,
) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (HAS_PROTOCOL.test(trimmed)) {
    return trimmed;
  }

  const normalised = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return `${SOCIAL_URL_BASE[platform]}${normalised}`;
};
