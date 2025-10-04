export type MockSocials = {
  instagram: string;
  linkedin: string;
  x: string;
};

export type MockUser = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  banner: string;
  socials: MockSocials;
};

export type MockPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  dateISO: string;
  text: string;
  image?: string;
};

export const mockUser: MockUser = {
  id: 'user1',
  name: 'Aarav Kumar',
  handle: 'user1',
  bio: 'Creative director & visual storyteller 🎨  Passionate about design thinking and aesthetic minimalism. Currently working on sustainable art projects in Bangalore.',
  avatar: '',
  banner: '',
  socials: {
    instagram: 'aarav_insta',
    linkedin: 'aarav-ln',
    x: 'aaravx',
  },
};

export const mockPosts: MockPost[] = [
  {
    id: 'p1',
    authorId: 'user1',
    authorName: 'Aarav Kumar',
    authorHandle: 'user1',
    dateISO: '2025-10-01',
    text: 'Explored a new coffee roastery today ☕ Loved their single-origin brews and cozy ambiance. Any recommendations for pour-over techniques?',
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'p2',
    authorId: 'user1',
    authorName: 'Aarav Kumar',
    authorHandle: 'user1',
    dateISO: '2025-09-18',
    text: 'Spent the afternoon sketching new concepts for a sustainable art installation 🌿 Feeling inspired by the textures of reclaimed wood.',
    image: '',
  },
  {
    id: 'p3',
    authorId: 'user1',
    authorName: 'Aarav Kumar',
    authorHandle: 'user1',
    dateISO: '2025-08-30',
    text: 'Color study from today’s moodboard session 🎨 Experimenting with neon gradients and ambient lighting.',
    image: 'https://images.unsplash.com/photo-1526481280695-3c46976cd67c?auto=format&fit=crop&w=1200&q=80',
  },
];
