import React from 'react';

import { SocialBrandBadge } from '../../src/components/social-brand-badge';
import type { SocialPlatformId } from '../../src/constants/socialPlatforms';
import { render, screen } from '../utils/render';

describe('SocialBrandBadge', () => {
  it.each<{
    accessibilityLabel: string;
    platform: SocialPlatformId;
  }>([
    { platform: 'instagram', accessibilityLabel: 'Instagram logo' },
    { platform: 'twitter', accessibilityLabel: 'X logo' },
    { platform: 'linkedin', accessibilityLabel: 'LinkedIn logo' },
  ])('renders the official $accessibilityLabel asset', ({ accessibilityLabel, platform }) => {
    render(<SocialBrandBadge platform={platform} size={40} />);

    expect(screen.getByTestId(`social-brand-badge-${platform}`)).toBeTruthy();
    expect(screen.getByRole('image', { name: accessibilityLabel })).toBeTruthy();
  });
});
