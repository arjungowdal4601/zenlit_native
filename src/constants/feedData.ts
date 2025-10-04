import type { SocialLinks } from './socialPlatforms';

export type FeedPost = {
  id: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
    socialLinks?: SocialLinks;
  };
  content: string;
  image?: string;
  timestamp: string;
};

export const FEED_DATA: FeedPost[] = [
  {
    id: '1',
    author: {
      name: 'Alex Johnson',
      username: 'alexjohnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
      socialLinks: {
        instagram: 'alexj_dev',
        linkedin: 'alex-johnson-dev',
        twitter: 'alexjohnson_ai',
      },
    },
    content:
      'Exploring new AI tools today! Anyone else experimenting with real-time collaborative agents?',
    image: 'https://images.unsplash.com/photo-1580894897406-8916b1b3f936?auto=format&fit=crop&w=800&q=80',
    timestamp: '2h',
  },
  {
    id: '2',
    author: {
      name: 'Sarah Chen',
      username: 'sarahchen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc',
      socialLinks: {
        instagram: 'sarahchen_design',
        linkedin: 'sarah-chen-ux',
        twitter: 'sarahdesigns',
      },
    },
    content:
      'Loving the Zenlit community vibes! Just wrapped a workshop on inclusive design principles for AR experiences.',
    timestamp: '5h',
  },
  {
    id: '3',
    author: {
      name: 'Marcus Rodriguez',
      username: 'marcusrodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c7d2fe',
      socialLinks: {
        instagram: 'marcus_startup',
        linkedin: 'marcus-rodriguez-ceo',
        twitter: 'marcusfintech',
      },
    },
    content:
      'Demo day prep is in full swing. Building slides that actually tell the story has been the toughest part.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    timestamp: '1d',
  },
  {
    id: '4',
    author: {
      name: 'Priya Patel',
      username: 'priyapatel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=f2f0ff',
      socialLinks: {
        instagram: 'priya_pm',
        linkedin: 'priya-patel-product',
        twitter: 'priyapm',
      },
    },
    content:
      'Releasing our first community roadmap later this week. Excited (and a little nervous) to get feedback!',
    timestamp: '2d',
  },
  {
    id: '5',
    author: {
      name: 'David Kim',
      username: 'davidkim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=f8f4e8',
      socialLinks: {
        instagram: 'dkim_codes',
        linkedin: 'david-kim-dev',
        twitter: 'dkim_js',
      },
    },
    content:
      'Shared a new starter kit for performance profiling React Native apps. Happy to DM the repo link! ??',
    timestamp: '3d',
  },
];
