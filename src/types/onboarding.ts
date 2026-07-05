export type ResolveOnboardingOptions = {
  userId?: string | null;
};

export type ProfileBasicsInput = {
  display_name: string;
  user_name: string;
  date_of_birth: string;
  gender: string;
};

export type OptionalProfileDetailsInput = {
  bio?: string | null;
  instagram?: string | null;
  x_twitter?: string | null;
  linkedin?: string | null;
  profile_pic_url?: string | null;
  banner_url?: string | null;
};

export type ServiceResult<T> = {
  data: T | null;
  error: Error | null;
};
