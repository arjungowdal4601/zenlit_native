import React from 'react';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

import type { SocialPlatformId } from './nearbyUsers';

export type IconRendererProps = {
  color: string;
  size: number;
};

export type SocialPlatformMeta = {
  id: SocialPlatformId;
  label: string;
  backgroundColor?: ColorValue;
  gradient?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  renderIcon: (props: IconRendererProps) => React.ReactNode;
};

export const socialPlatforms: Record<SocialPlatformId, SocialPlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    gradient: ['#F58529', '#DD2A7B', '#8134AF'] as const,
    renderIcon: ({ color, size }) => <FontAwesome5 name="instagram" color={color} size={size} />,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    backgroundColor: '#0A66C2',
    renderIcon: ({ color, size }) => <FontAwesome5 name="linkedin-in" color={color} size={size} />,
  },
  x: {
    id: 'x',
    label: 'X',
    backgroundColor: '#000000',
    renderIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="alpha-x" color={color} size={size} />
    ),
  },
};

export const orderedSocialPlatforms = Object.values(socialPlatforms);
