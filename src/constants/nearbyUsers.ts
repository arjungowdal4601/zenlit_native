export type SocialPlatformId = 'instagram' | 'linkedin' | 'x';

export type SocialLinks = Partial<Record<SocialPlatformId, string>>;

export type NearbyUser = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  links: SocialLinks;
};

export const nearbyUsers: NearbyUser[] = [
  {
    id: 'aarav-kumar',
    name: 'Aarav Kumar',
    handle: '@aarav',
    bio: 'Creative director and visual storyteller. Passionate about design and community.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face',
    links: {
      instagram: 'https://instagram.com/aarav',
      linkedin: 'https://linkedin.com/in/aarav',
      x: 'https://x.com/aarav',
    },
  },
  {
    id: 'diya-sharma',
    name: 'Diya Sharma',
    handle: '@diya',
    bio: 'Software engineer by day, adventure photographer by night. Sharing tech and travel tips.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=160&h=160&fit=crop&crop=face',
    links: {
      instagram: 'https://instagram.com/diya',
      linkedin: 'https://linkedin.com/in/diya',
      x: 'https://x.com/diya',
    },
  },
  {
    id: 'vikram-rao',
    name: 'Vikram Rao',
    handle: '@vikram',
    bio: 'Entrepreneur building thoughtful edtech experiences. Former consultant and lifelong learner.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face',
    links: {
      instagram: 'https://instagram.com/vikram',
      linkedin: 'https://linkedin.com/in/vikram',
      x: 'https://x.com/vikram',
    },
  },
  {
    id: 'ananya-iyer',
    name: 'Ananya Iyer',
    handle: '@ananya',
    bio: 'Classical dancer and movement coach. Teaching Bharatanatyam and mindful mobility worldwide.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face',
    links: {
      instagram: 'https://instagram.com/ananya',
      linkedin: 'https://linkedin.com/in/ananya',
      x: 'https://x.com/ananya',
    },
  },
];
