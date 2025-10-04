"use client";

import Image from 'next/image';
import SocialLinkButton from '@/components/SocialLinkButton';
import { DEFAULT_VISIBLE_PLATFORMS, ensureSocialUrl, getTwitterHandle, type SocialLinks, type SocialPlatformId } from '@/constants/socialPlatforms';

interface PostProps {
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
  selectedAccounts?: SocialPlatformId[];
  showSocialLinks?: boolean;
}

const Post = ({
  author,
  content,
  image,
  timestamp,
  selectedAccounts = DEFAULT_VISIBLE_PLATFORMS,
  showSocialLinks = true,
}: PostProps) => {
  const instagramUrl = ensureSocialUrl('instagram', author.socialLinks?.instagram);
  const linkedinUrl = ensureSocialUrl('linkedin', author.socialLinks?.linkedin);
  const twitterHandle = getTwitterHandle(author.socialLinks);
  const twitterUrl = ensureSocialUrl('twitter', twitterHandle);

  return (
    <div className="mb-3 relative">
      {/* Social Links - Top Right */}
      {showSocialLinks && author.socialLinks && (
        <div className="absolute top-0 right-0 mt-2 flex items-center space-x-3">
          {selectedAccounts.includes('instagram') && instagramUrl && (
            <SocialLinkButton
              platform="instagram"
              href={instagramUrl}
              buttonClassName="hover:scale-110"
              containerClassName="w-6 h-6 sm:w-7 sm:h-7"
              iconClassName="w-5 h-5 sm:w-6 sm:h-6"
              ariaLabel="Instagram"
            />
          )}

          {selectedAccounts.includes('linkedin') && linkedinUrl && (
            <SocialLinkButton
              platform="linkedin"
              href={linkedinUrl}
              buttonClassName="hover:scale-110"
              containerClassName="w-6 h-6 sm:w-7 sm:h-7"
              iconClassName="w-5 h-5 sm:w-6 sm:h-6"
              ariaLabel="LinkedIn"
            />
          )}

          {selectedAccounts.includes('twitter') && twitterUrl && (
            <SocialLinkButton
              platform="twitter"
              href={twitterUrl}
              buttonClassName="hover:scale-110"
              containerClassName="w-6 h-6 sm:w-7 sm:h-7"
              iconClassName="w-5 h-5 sm:w-6 sm:h-6"
              ariaLabel="X (Twitter)"
            />
          )}
        </div>
      )}

      <div className="flex space-x-4">
        {/* Enhanced Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={
              author.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&color=fff&size=40`
            }
            alt={author.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover"
          />
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="mb-2">
            <h3 className="text-white font-semibold text-base">{author.name}</h3>
            <span className="text-gray-400 text-sm">@{author.username} &bull; {timestamp}</span>
          </div>

          {/* Post Text */}
          <p className="text-gray-100 text-base mb-4 leading-tight">
            {content}
          </p>

          {/* Post Image */}
          {image && (
            <div className="rounded-xl overflow-hidden border border-gray-700 shadow-md">
              <Image
                src={image}
                alt="Post image"
                width={500}
                height={300}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Post separator */}
      <div className={image ? 'mt-3 mb-2' : 'mt-2 mb-1'}>
        <div className="h-px bg-gray-600 w-full" />
      </div>
    </div>
  );
};

export default Post;
