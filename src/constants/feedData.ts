export type FeedPostAuthorSocialLinks = {
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
};

export type FeedPostAuthor = {
  id?: string;
  name: string;
  username: string;
  avatar?: string | null;
  socialLinks?: FeedPostAuthorSocialLinks;
};

export type FeedPost = {
  id: string;
  author: FeedPostAuthor;
  content: string;
  image?: string | null;
  timestamp?: string | null;
};

