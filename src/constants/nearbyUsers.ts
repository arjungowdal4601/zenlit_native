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
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alex&backgroundColor=b6e3f4',
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
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&backgroundColor=ffd5dc',
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
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Marcus&backgroundColor=c7d2fe',
    bio: 'Entrepreneur and startup founder. Building the next generation of fintech solutions. Mentor at local accelerator programs and angel investor.',
    distance: '1.5 km',
    socialLinks: {
      instagram: 'marcus_startup',
      linkedin: 'marcus-rodriguez-ceo',
      twitter: 'marcusfintech',
    },
  },
  {
    id: '4',
    name: 'Priya Patel',
    username: 'priyapatel',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Priya&backgroundColor=f2f0ff',
    bio: 'Product manager focused on community apps. Leading cross-functional teams to deliver meaningful experiences. Loves yoga and writing short stories.',
    distance: '2.3 km',
    socialLinks: {
      instagram: 'priya_pm',
      linkedin: 'priya-patel-product',
      twitter: 'priyapm',
    },
  },
  {
    id: '5',
    name: 'David Kim',
    username: 'davidkim',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=David&backgroundColor=f8f4e8',
    bio: 'Full-stack developer obsessed with performance and DX. Hosting weekly coding meetups and contributing to open-source projects.',
    distance: '2.8 km',
    socialLinks: {
      instagram: 'dkim_codes',
      linkedin: 'david-kim-dev',
      twitter: 'dkim_js',
    },
  },
  {
    id: '6',
    name: 'Isabella Rossi',
    username: 'isabellarossi',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Isabella&backgroundColor=fdecc8',
    bio: 'Digital storyteller weaving narratives for brands and creators. Running a newsletter about mindful productivity and creativity.',
    distance: '3.1 km',
    socialLinks: {
      instagram: 'storytellingbella',
      linkedin: 'isabella-rossi',
      twitter: 'bellanarrates',
    },
  },
  {
    id: '7',
    name: 'Hiro Tanaka',
    username: 'hirotanaka',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Hiro&backgroundColor=d4f2d2',
    bio: 'AR/VR developer experimenting with immersive experiences. Always exploring the intersection of art and technology.',
    distance: '3.6 km',
    socialLinks: {
      instagram: 'hiroxr',
      linkedin: 'hiro-tanaka',
      twitter: 'hiroimmersive',
    },
  },
  {
    id: '8',
    name: 'Emily Carter',
    username: 'emilycarter',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Emily&backgroundColor=e9eafe',
    bio: 'Wellness coach integrating mindfulness with modern work culture. Hosting community sessions on balance and resilience.',
    distance: '4.0 km',
    socialLinks: {
      instagram: 'emilywellness',
      linkedin: 'emily-carter-coach',
      twitter: 'zenemily',
    },
  },
  {
    id: '9',
    name: 'Noah Williams',
    username: 'noahwilliams',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Noah&backgroundColor=ffe2f9',
    bio: 'Community builder fostering collaborations between creators and startups. Passionate about inclusive design and civic tech.',
    distance: '4.5 km',
    socialLinks: {
      instagram: 'noahconnects',
      linkedin: 'noah-williams-collab',
      twitter: 'noahcollabs',
    },
  },
  {
    id: '10',
    name: 'Lila Singh',
    username: 'lilasingh',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lila&backgroundColor=fde3d9',
    bio: 'Data scientist translating complex insights into actionable stories. Volunteering with STEM education initiatives.',
    distance: '5.2 km',
    socialLinks: {
      instagram: 'lila_datasci',
      linkedin: 'lila-singh',
      twitter: 'liladata',
    },
  },
];
