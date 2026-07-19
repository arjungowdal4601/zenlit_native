import {
  SOCIAL_PLATFORMS,
  ensureSocialUrl,
  extractUsername,
  getTwitterHandle,
} from '../../src/constants/socialPlatforms';

describe('social platform helpers', () => {
  it('extracts clean usernames from usernames and pasted links', () => {
    expect(extractUsername('@zenlit')).toBe('zenlit');
    expect(extractUsername('https://instagram.com/zenlit/')).toBe('zenlit');
    expect(extractUsername('https://linkedin.com/in/alex-johnson')).toBe('alex-johnson');
  });

  it('creates expected profile URLs without duplicating protocols', () => {
    expect(ensureSocialUrl('twitter', '@zenlit')).toBe('https://x.com/zenlit');
    expect(ensureSocialUrl('instagram', 'https://instagram.com/zenlit')).toBe(
      'https://instagram.com/zenlit',
    );
    expect(ensureSocialUrl('linkedin', '')).toBeNull();
  });

  it('treats x_twitter as the fallback Twitter handle field', () => {
    expect(getTwitterHandle({ x_twitter: 'zenlit_x' })).toBe('zenlit_x');
    expect(getTwitterHandle({ twitter: 'zenlit', x_twitter: 'zenlit_x' })).toBe('zenlit');
  });

  it('presents the existing twitter platform key as X', () => {
    expect(SOCIAL_PLATFORMS.twitter.id).toBe('twitter');
    expect(SOCIAL_PLATFORMS.twitter.label).toBe('X');
    expect(ensureSocialUrl(SOCIAL_PLATFORMS.twitter.id, '@zenlit')).toBe(
      'https://x.com/zenlit',
    );
  });
});
