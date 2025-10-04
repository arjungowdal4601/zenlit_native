'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Compass, Plus, MessageSquare, UserCircle } from 'lucide-react';

const navigationItems = [
  { path: '/radar', Icon: Users },
  { path: '/feed', Icon: Compass },
  { path: '/create', Icon: Plus },
  { path: '/messages', Icon: MessageSquare },
  { path: '/profile', Icon: UserCircle },
];

const Navigation = () => {
  const pathname = usePathname() ?? '';

  // Hide the bottom navigation only on individual chat routes
  if (pathname.startsWith('/messages/')) return null;

  const isOtherUserProfile = pathname.startsWith('/profile/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-slate-700 rounded-t-3xl shadow-2xl">
      <div className="flex justify-around items-center py-2 px-6">
        {navigationItems.map(({ path, Icon }) => {
          // Default active behavior
          let isActive = pathname === path || pathname.startsWith(`${path}/`);

          // Special cases:
          // 1) Keep Radar highlighted when viewing other users' profiles (/profile/[id])
          if (path === '/radar') {
            isActive = pathname === '/radar' || isOtherUserProfile;
          }
          // 2) Only highlight Profile for the personal profile route (/profile)
          if (path === '/profile') {
            isActive = pathname === '/profile';
          }

          return (
            <Link
              key={path}
              href={path}
              className="flex items-center justify-center p-3 rounded-xl transition-all duration-300 hover:bg-slate-800/30"
              style={isActive
                ? {
                    boxShadow: 'rgba(255, 255, 255, 0.2) 4px 4px 8px, rgba(255, 255, 255, 0.1) -2px -2px 4px',
                    transform: 'translateY(-2px)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }
                : {}}
            >
              <Icon size={24} className="transition-all duration-200 text-white" strokeWidth={2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
