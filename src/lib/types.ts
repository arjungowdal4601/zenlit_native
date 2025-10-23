export interface Profile {
  id: string;
  display_name: string;
  user_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  email: string;
  account_created_at: string;
}

export interface SocialLinks {
  id: string;
  profile_pic_url: string | null;
  banner_url: string | null;
  bio: string | null;
  instagram: string | null;
  x_twitter: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: Profile & { social_links?: SocialLinks };
}

export interface Location {
  id: string;
  lat_full: number | null;
  long_full: number | null;
  lat_short: number | null;
  long_short: number | null;
  updated_at: string;
}

export interface NearbyUserData {
  id: string;
  name: string;
  username: string;
  profilePhoto: string | null;
  bio: string | null;
  distance: string;
  socialLinks: {
    instagram?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
  };
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
}

export interface MessageThread {
  other_user_id: string;
  other_user: Profile & { social_links?: SocialLinks };
  last_message: Message;
  unread_count: number;
  is_anonymous: boolean;
}

export interface UserUnreadCount {
  sender_id: string;
  unread_count: number;
}

export type StorageBucket = 'profile-images' | 'post-images' | 'feedback-images';
