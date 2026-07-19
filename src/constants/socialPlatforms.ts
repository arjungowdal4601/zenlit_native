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

interface SocialPlatformMeta {
  id: SocialPlatformId;
  label: string;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatformId, SocialPlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
  },
  twitter: {
    id: 'twitter',
    label: 'X',
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

export const extractUsername = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('@')) {
    return trimmed.slice(1);
  }

  if (HAS_PROTOCOL.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      const parts = pathname.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : '';
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

