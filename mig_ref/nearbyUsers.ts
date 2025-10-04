export interface NearbyUser {
  id: string;
  name: string;
  username: string;
  profilePhoto: string;
  bio: string;
  distance: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export const NEARBY_USERS: NearbyUser[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    username: 'alexjohnson',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
    bio: 'Software engineer passionate about AI and machine learning. Love hiking and exploring new technologies. Always up for a good conversation about tech trends and innovation.',
    distance: '0.8 km',
    socialLinks: {
      instagram: 'alexj_dev',
      linkedin: 'alex-johnson-dev',
      twitter: 'alexjohnson_ai',
    },
  },
  {
    id: '2',
    name: 'Sarah Chen',
    username: 'sarahchen',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc',
    bio: 'UX Designer creating beautiful and intuitive digital experiences. Coffee enthusiast and weekend photographer. Currently working on sustainable design practices.',
    distance: '1.2 km',
    socialLinks: {
      instagram: 'sarahchen_design',
      linkedin: 'sarah-chen-ux',
      twitter: 'sarahdesigns',
    },
  },
  {
    id: '3',
    name: 'Marcus Rodriguez',
    username: 'marcusrodriguez',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c7d2fe',
    bio: 'Entrepreneur and startup founder. Building the next generation of fintech solutions. Mentor at local accelerator programs and angel investor.',
    distance: '1.5 km',
    socialLinks: {
      instagram: 'marcus_startup',
      linkedin: 'marcus-rodriguez-ceo',
      twitter: 'marcusfintech',
    },
  },
];