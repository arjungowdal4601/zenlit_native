import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { CompressedImage } from '../utils/imageCompression';

type OnboardingProfileDraftContextValue = {
  bio: string;
  setBio: Dispatch<SetStateAction<string>>;
  bannerImage: CompressedImage | null;
  setBannerImage: Dispatch<SetStateAction<CompressedImage | null>>;
  profileImage: CompressedImage | null;
  setProfileImage: Dispatch<SetStateAction<CompressedImage | null>>;
  bannerImageUrl: string | null;
  setBannerImageUrl: Dispatch<SetStateAction<string | null>>;
  profileImageUrl: string | null;
  setProfileImageUrl: Dispatch<SetStateAction<string | null>>;
  instagram: string;
  setInstagram: Dispatch<SetStateAction<string>>;
  twitter: string;
  setTwitter: Dispatch<SetStateAction<string>>;
  linkedin: string;
  setLinkedin: Dispatch<SetStateAction<string>>;
  clearDraft: () => void;
};

const OnboardingProfileDraftContext =
  createContext<OnboardingProfileDraftContextValue | null>(null);

export const OnboardingProfileDraftProvider = ({ children }: { children: ReactNode }) => {
  // ponytail: in-memory only; use AsyncStorage if closed-tab draft recovery becomes required.
  const [bio, setBio] = useState('');
  const [bannerImage, setBannerImage] = useState<CompressedImage | null>(null);
  const [profileImage, setProfileImage] = useState<CompressedImage | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const clearDraft = useCallback(() => {
    setBio('');
    setBannerImage(null);
    setProfileImage(null);
    setBannerImageUrl(null);
    setProfileImageUrl(null);
    setInstagram('');
    setTwitter('');
    setLinkedin('');
  }, []);

  return (
    <OnboardingProfileDraftContext.Provider
      value={{
        bio,
        setBio,
        bannerImage,
        setBannerImage,
        profileImage,
        setProfileImage,
        bannerImageUrl,
        setBannerImageUrl,
        profileImageUrl,
        setProfileImageUrl,
        instagram,
        setInstagram,
        twitter,
        setTwitter,
        linkedin,
        setLinkedin,
        clearDraft,
      }}
    >
      {children}
    </OnboardingProfileDraftContext.Provider>
  );
};

export const useOnboardingProfileDraft = () => {
  const context = useContext(OnboardingProfileDraftContext);
  if (!context) {
    throw new Error('useOnboardingProfileDraft must be used inside OnboardingProfileDraftProvider');
  }
  return context;
};
