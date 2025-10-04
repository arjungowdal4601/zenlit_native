'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import AppHeader from '@/components/AppHeader';
import LogoutConfirmation from '@/components/LogoutConfirmation';
import SocialLinkButton from '@/components/SocialLinkButton';
import Post from '@/components/Post';
import { ensureSocialUrl } from '@/constants/socialPlatforms';
import Image from 'next/image';
import { MoreHorizontal, Edit, MessageSquare, LogOut, FileText } from 'lucide-react';
import { 
  fetchCurrentUserProfile, 
  CompleteUserProfile, 
  UserPost,
  getProfilePictureUrl,
  getBannerUrl,
  getSocialMediaLinks
} from '@/utils/profileData';

const ProfileScreen = () => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const bioRef = useRef<HTMLParagraphElement | null>(null);
  const [bioTruncated, setBioTruncated] = useState(false);
  
  // Real data states
  const [userProfile, setUserProfile] = useState<CompleteUserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setError(null);

        const data = await fetchCurrentUserProfile();

        if (!isMounted) return;

        if (data) {
          setUserProfile(data);
          setPosts(data.posts);
        } else {
          setError('Profile not found.');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading user data:', err);
          setError('Failed to load profile data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detect if bio is visually truncated when clamped
  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    const truncated = el.scrollHeight > el.clientHeight + 1;
    setBioTruncated(truncated);
  }, [userProfile, showFullBio]);

  // Close dropdown on outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownOpen) return;
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dropdownOpen) return;
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const socialLinks = useMemo(
    () => getSocialMediaLinks(userProfile?.socialLinks ?? null),
    [userProfile?.socialLinks]
  );

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
    setPostMenuOpen(null);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      setPosts(posts.filter(post => post.id !== postToDelete));
      setPostToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const cancelDelete = () => {
    setPostToDelete(null);
    setDeleteModalOpen(false);
  };

  const togglePostMenu = (postId: string) => {
    setPostMenuOpen(postMenuOpen === postId ? null : postId);
  };

  const handleMenuAction = (action: string) => {
    if (action === 'Logout') {
      setLogoutModalOpen(true);
    } else if (action === 'Give Feedback') {
      router.push('/feedback');
    } else if (action === 'Edit Profile') {
      router.push('/edit-profile');
    } else {
      console.log(`${action} clicked`);
    }
    setDropdownOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="text-white text-lg">Loading profile...</div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !userProfile) {
    return (
      <AppLayout>
        <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">{error || 'Profile not found'}</div>
            <button 
              onClick={() => router.refresh()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Get social media links with proper structure
  const instagramUrl = ensureSocialUrl('instagram', socialLinks.instagram);
  const linkedinUrl = ensureSocialUrl('linkedin', socialLinks.linkedin);
  const twitterUrl = ensureSocialUrl('twitter', socialLinks.twitter);

  return (
    <AppLayout>
      <div className="bg-black">
        {/* Header with hamburger menu */}
        <div className="max-w-4xl mx-auto px-4">
          <AppHeader
            title="Profile"
            right={(
              <button
                ref={triggerRef}
                type="button"
                aria-label="Profile menu"
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-controls="profile-menu-dropdown"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDropdownOpen((v) => !v);
                  }
                }}
                className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-center space-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <div className={`w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${dropdownOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${dropdownOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${dropdownOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </button>
            )}
          />
        </div>

        {/* Dropdown Menu */}
        <div
          ref={dropdownRef}
          id="profile-menu-dropdown"
          role="menu"
          aria-label="Profile menu"
          className={`overflow-hidden transition-all duration-300 ease-in-out max-w-4xl mx-auto px-4 ${
            dropdownOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-black py-2">
            <button
              onClick={() => handleMenuAction('Edit Profile')}
              className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 transition-colors flex items-center gap-3"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              Edit Profile
            </button>
            <button
              onClick={() => handleMenuAction('Give Feedback')}
              className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 transition-colors flex items-center gap-3"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              Give Feedback
            </button>
            <button
              onClick={() => handleMenuAction('Logout')}
              className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 transition-colors flex items-center gap-3"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
                <LogOut className="w-4 h-4 text-white" />
              </div>
              Logout
            </button>
          </div>
        </div>

        {/* LinkedIn-style Banner */}
        <div className="w-full">
          <div className="relative">
            {/* Banner Background - Full width, no rounded corners */}
            <div 
              className="h-48 sm:h-64"
              style={{
                background: getBannerUrl(userProfile.socialLinks) 
                  ? `url(${getBannerUrl(userProfile.socialLinks)}) center/cover` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            ></div>

            {/* Profile Section */}
            <div className="relative bg-black px-4 sm:px-6 pb-3">
              {/* Profile Photo and Layout */}
              <div className="flex justify-between items-start pt-4">
                {/* Left Side: Profile Photo and User Info */}
                <div className="flex flex-col">
                  {/* Profile Photo - square with rounded corners */}
                  <div className="relative -mt-12 sm:-mt-16 mb-4">
                    <Image
                      src={getProfilePictureUrl(userProfile.socialLinks)}
                      alt={`${userProfile.profile.display_name || userProfile.profile.user_name}'s profile`}
                      width={120}
                      height={120}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover border-4 border-black"
                      priority
                    />
                  </div>

                  {/* User Info - Display name and username below profile pic */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                      {userProfile.profile.display_name || userProfile.profile.user_name}
                    </h1>
                    <p className="text-gray-400 text-sm mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                      @{userProfile.profile.user_name}
                    </p>
                  </div>
                </div>

                {/* Right Side: Social Links */}
                <div className="flex items-center space-x-1.5 pt-2">
                  <SocialLinkButton
                    platform="instagram"
                    href={instagramUrl ?? undefined}
                    buttonClassName={instagramUrl ? 'hover:scale-110' : 'pointer-events-none opacity-50 filter grayscale'}
                    containerClassName="w-8 h-8"
                    iconClassName="w-5 h-5"
                    ariaLabel="Instagram"
                  />

                  <SocialLinkButton
                    platform="linkedin"
                    href={linkedinUrl ?? undefined}
                    buttonClassName={linkedinUrl ? 'hover:scale-110' : 'pointer-events-none opacity-50 filter grayscale'}
                    containerClassName="w-8 h-8"
                    iconClassName="w-5 h-5"
                    ariaLabel="LinkedIn"
                  />

                  <SocialLinkButton
                    platform="twitter"
                    href={twitterUrl ?? undefined}
                    buttonClassName={twitterUrl ? 'hover:scale-110' : 'pointer-events-none opacity-50 filter grayscale'}
                    containerClassName="w-8 h-8"
                    iconClassName="w-5 h-5"
                    containerStyle={{ border: '1px solid #333' }}
                    ariaLabel="X (Twitter)"
                  />
                </div>
              </div>

              {/* Bio - Full width below the profile section */}
              <div className="mt-2">
                <p
                  ref={bioRef}
                  className="text-white text-base leading-normal max-w-2xl"
                  style={
                    showFullBio
                      ? { fontFamily: 'var(--font-inter)' }
                      : {
                          fontFamily: 'var(--font-inter)',
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }
                  }
                >
                  {userProfile.socialLinks?.bio || 'No bio available.'}
                </p>
                {!showFullBio && bioTruncated && (
                  <button
                    type="button"
                    onClick={() => setShowFullBio(true)}
                    className="text-blue-400 text-sm mt-1 hover:underline"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    more
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="mt-4 max-w-2xl mx-auto px-4">
            <div className="border-t border-gray-700"></div>
          </div>

          {/* Posts Section */}
          <div className="mt-3 space-y-2 max-w-2xl mx-auto px-4">
            <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
              Posts
            </h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-300 text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-500 text-sm">Share your first post to get started!</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id}>
                  <div className="mb-3 relative">
                    {/* 3-dots menu */}
                    <div className="absolute top-0 right-0 mt-2 z-20">
                      <button
                        onClick={() => togglePostMenu(post.id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {/* Dropdown menu */}
                      {postMenuOpen === post.id && (
                        <div className="absolute right-0 mt-1 w-32 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-30">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 rounded-md text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <Post
                      id={post.id}
                      author={{
                        name: userProfile?.profile.display_name || 'User',
                        username: userProfile?.profile.user_name || 'user',
                        avatar: getProfilePictureUrl(userProfile?.socialLinks || null),
                        socialLinks: getSocialMediaLinks(userProfile?.socialLinks || null),
                      }}
                      content={post.text || ''}
                      timestamp={new Date(post.created_at).toLocaleDateString()}
                      image={post.image_url || undefined}
                      showSocialLinks={false}
                    />
                  </div>
                  
                  {/* Separator Line between posts (not after the last post) */}
                  {index < posts.length - 1 && (
                    <div className="border-t border-gray-700 mb-3"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full border border-gray-700">
              <h3 className="text-white text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                Delete Post
              </h3>
              <p className="text-gray-300 text-sm mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                >
                  No
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation 
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </AppLayout>
  );
};

export default ProfileScreen;
