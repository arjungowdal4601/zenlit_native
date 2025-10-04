export type Thread = {
  id: string;
  peer: {
    id: string;
    name: string;
    avatar: string;
    subtitle?: string;
    isOnline?: boolean;
  };
  lastMessageAt: string;
  unreadCount: number;
  isAnonymous?: boolean;
};

export type ChatMsg = {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
};

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

export const THREADS: Thread[] = [
  {
    id: 'c1',
    peer: {
      id: 'alex-johnson',
      name: 'Alex Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
      subtitle: 'Product Designer',
      isOnline: true,
    },
    lastMessageAt: minutesAgo(28),
    unreadCount: 2,
  },
  {
    id: 'c2',
    peer: {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc',
      subtitle: 'UX Researcher',
    },
    lastMessageAt: minutesAgo(92),
    unreadCount: 0,
  },
  {
    id: 'c3',
    peer: {
      id: 'marcus-rodriguez',
      name: 'Marcus Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c7d2fe',
      subtitle: 'Founder, Fintech Labs',
    },
    lastMessageAt: hoursAgo(5),
    unreadCount: 0,
  },
  {
    id: 'c4',
    peer: {
      id: 'priya-patel',
      name: 'Priya Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=f2f0ff',
      subtitle: 'Community Lead',
    },
    lastMessageAt: hoursAgo(11),
    unreadCount: 1,
  },
  {
    id: 'c5',
    peer: {
      id: 'david-kim',
      name: 'David Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=f8f4e8',
      subtitle: 'Full-stack Dev',
    },
    lastMessageAt: daysAgo(1),
    unreadCount: 0,
  },
  {
    id: 'a1',
    peer: {
      id: 'anonymous-peak',
      name: 'Anonymous',
      avatar: '',
    },
    lastMessageAt: minutesAgo(15),
    unreadCount: 3,
    isAnonymous: true,
  },
  {
    id: 'a2',
    peer: {
      id: 'anonymous-coffee',
      name: 'Anonymous',
      avatar: '',
    },
    lastMessageAt: hoursAgo(9),
    unreadCount: 0,
    isAnonymous: true,
  },
  {
    id: 'a3',
    peer: {
      id: 'anonymous-mentor',
      name: 'Anonymous',
      avatar: '',
    },
    lastMessageAt: daysAgo(3),
    unreadCount: 0,
    isAnonymous: true,
  },
];

export const MESSAGES_BY_THREAD: Record<string, ChatMsg[]> = {
  c1: [
    { id: 'c1-m1', text: 'Morning! Still up for the cafe later?', sentAt: hoursAgo(6), fromMe: false },
    { id: 'c1-m2', text: 'Absolutely. Want to try the new matcha blend.', sentAt: hoursAgo(5.8), fromMe: true },
    { id: 'c1-m3', text: "Perfect, I will grab us a table.", sentAt: hoursAgo(5.75), fromMe: false },
    { id: 'c1-m4', text: 'Leaving now. ETA 15 mins.', sentAt: minutesAgo(43), fromMe: true },
    { id: 'c1-m5', text: 'Same here — see you soon!', sentAt: minutesAgo(30), fromMe: false },
    { id: 'c1-m6', text: 'Grabbing seats by the window.', sentAt: minutesAgo(28), fromMe: false },
  ],
  c2: [
    { id: 'c2-m1', text: 'Uploaded the new research deck.', sentAt: hoursAgo(8), fromMe: false },
    { id: 'c2-m2', text: 'Reviewing now. Layout looks great.', sentAt: hoursAgo(7.5), fromMe: true },
    { id: 'c2-m3', text: 'Noted a few callouts on slide 12.', sentAt: hoursAgo(7.3), fromMe: true },
    { id: 'c2-m4', text: 'Thanks! I will address them before lunch.', sentAt: minutesAgo(95), fromMe: false },
  ],
  c3: [
    { id: 'c3-m1', text: 'Investors loved the prototype demo.', sentAt: hoursAgo(20), fromMe: false },
    { id: 'c3-m2', text: 'Amazing news — congrats!', sentAt: hoursAgo(19.7), fromMe: true },
    { id: 'c3-m3', text: 'Let’s debrief tomorrow, same time?', sentAt: hoursAgo(5), fromMe: false },
  ],
  c4: [
    { id: 'c4-m1', text: 'Community roadmap outline is ready.', sentAt: daysAgo(2), fromMe: false },
    { id: 'c4-m2', text: 'Skimmed it — excited for the mentorship series.', sentAt: daysAgo(2) , fromMe: true },
    { id: 'c4-m3', text: 'Adding your feedback tonight.', sentAt: hoursAgo(12), fromMe: false },
    { id: 'c4-m4', text: 'Ping me if you need another review.', sentAt: hoursAgo(11), fromMe: true },
  ],
  c5: [
    { id: 'c5-m1', text: 'Shared a performance profiling toolkit.', sentAt: daysAgo(4), fromMe: false },
    { id: 'c5-m2', text: 'Downloading now — appreciate it!', sentAt: daysAgo(3.9), fromMe: true },
    { id: 'c5-m3', text: 'Let me know if anything is unclear.', sentAt: daysAgo(1), fromMe: false },
  ],
  a1: [
    { id: 'a1-m1', text: 'Thanks for welcoming me to the community.', sentAt: hoursAgo(3), fromMe: false },
    { id: 'a1-m2', text: 'Happy you’re here! Anything fun planned today?', sentAt: hoursAgo(2.8), fromMe: true },
    { id: 'a1-m3', text: 'Just exploring — any hidden gems I should visit?', sentAt: hoursAgo(2.7), fromMe: false },
    { id: 'a1-m4', text: 'Try the rooftop market near the riverfront.', sentAt: minutesAgo(20), fromMe: true },
    { id: 'a1-m5', text: 'On my way. Appreciate the tip!', sentAt: minutesAgo(15), fromMe: false },
  ],
  a2: [
    { id: 'a2-m1', text: 'Loved your talk earlier!', sentAt: hoursAgo(10), fromMe: false },
    { id: 'a2-m2', text: 'Thank you — glad it resonated.', sentAt: hoursAgo(9.7), fromMe: true },
    { id: 'a2-m3', text: 'Would love to stay anonymous for now.', sentAt: hoursAgo(9.5), fromMe: false },
  ],
  a3: [
    { id: 'a3-m1', text: 'Holding space if you ever want to vent.', sentAt: daysAgo(5), fromMe: false },
    { id: 'a3-m2', text: 'Appreciate it — might take you up on that soon.', sentAt: daysAgo(3), fromMe: true },
  ],
};

export const getLastMessageForThread = (threadId: string) => {
  const messages = MESSAGES_BY_THREAD[threadId];
  if (!messages || messages.length === 0) {
    return undefined;
  }
  return messages[messages.length - 1];
};

const formatTimeNumber = (value: number) => value.toString().padStart(2, '0');

export const formatMessageTime = (iso: string) => {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = formatTimeNumber(date.getMinutes());
  const isAm = hours < 12;
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${isAm ? 'AM' : 'PM'}`;
};

export const formatDayLabel = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
