import React, { type ReactElement } from 'react';
import { Feather } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';

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

type IconRenderer = (props?: { size?: number; color?: string }) => ReactElement;

interface SocialPlatformMeta {
  id: SocialPlatformId;
  label: string;
  style: {
    backgroundColor?: string;
  };
  renderIcon: IconRenderer;
  wantsWhiteIcon?: boolean;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatformId, SocialPlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    style: {},
    renderIcon: (props) =>
      React.createElement(FontAwesome6 as any, {
        name: 'instagram',
        size: props?.size ?? 16,
        color: props?.color ?? '#ffffff',
      }),
    wantsWhiteIcon: true,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    style: { backgroundColor: '#0077B5' },
    renderIcon: (props) =>
      React.createElement(FontAwesome6 as any, {
        name: 'linkedin',
        size: props?.size ?? 16,
        color: props?.color ?? '#ffffff',
      }),
    wantsWhiteIcon: true,
  },
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    style: { backgroundColor: '#000000' },
    renderIcon: (props) =>
      React.createElement(FontAwesome6 as any, {
        name: 'x-twitter',
        size: props?.size ?? 16,
        color: props?.color ?? '#ffffff',
      }),
    wantsWhiteIcon: true,
  },
};

export const SOCIAL_PLATFORM_IDS = Object.keys(
  SOCIAL_PLATFORMS,
) as SocialPlatformId[];

export const DEFAULT_VISIBLE_PLATFORMS: SocialPlatformId[] = [
  ...SOCIAL_PLATFORM_IDS,
];

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

