import type { CSSProperties, ReactElement } from 'react';
import { Instagram } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

export type SocialPlatformId = 'instagram' | 'linkedin' | 'twitter';

export type SocialLinks = {
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  x_twitter?: string | null;
};

export const getTwitterHandle = (links?: SocialLinks | null) => {
  if (!links) return null;
  return links.twitter ?? links.x_twitter ?? null;
};

type IconRenderer = (className?: string) => ReactElement;

interface SocialPlatformMeta {
  id: SocialPlatformId;
  label: string;
  style: CSSProperties;
  wrapperClassName: string;
  iconClassName?: string;
  renderIcon: IconRenderer;
}

const linkedinIcon: IconRenderer = (className) => (
  <svg className={className} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3z"
      fill="#0077B5"
    />
    <path
      d="M135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"
      fill="white"
    />
  </svg>
);

export const SOCIAL_PLATFORMS: Record<SocialPlatformId, SocialPlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    style: {
      background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    },
    wrapperClassName: 'flex items-center justify-center rounded-lg',
    iconClassName: 'text-white',
    renderIcon: (className) => <Instagram className={className} />,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    style: {
      background: '#0077B5',
    },
    wrapperClassName: 'flex items-center justify-center rounded-sm',
    renderIcon: (className) => linkedinIcon(className ?? 'w-5 h-5'),
  },
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    style: {
      background: '#000000',
    },
    wrapperClassName: 'flex items-center justify-center rounded-sm',
    iconClassName: 'text-white',
    renderIcon: (className) => <FaXTwitter className={className} />,
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

export const ensureSocialUrl = (platform: SocialPlatformId, value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (HAS_PROTOCOL.test(trimmed)) {
    return trimmed;
  }
  const normalised = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return `${SOCIAL_URL_BASE[platform]}${normalised}`;
};
