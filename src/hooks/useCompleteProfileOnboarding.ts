import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { useOnboardingProfileDraft } from '../contexts/OnboardingProfileDraftContext';
import { isAuthReady } from '../services/authService';
import {
  resolveOnboardingState,
  saveOptionalProfileDetails,
  skipOptionalProfileDetails,
} from '../services/onboardingService';
import { uploadProfileImage } from '../services/storageService';
import type { CompressedImage } from '../utils/imageCompression';
import { getFriendlyOnboardingError } from '../utils/onboardingErrors';
import { getRouteForOnboardingState, ROUTES } from '../utils/onboardingState';

const uploadImageIfNeeded = async (
  image: CompressedImage | null,
  filePrefix: 'avatar' | 'banner',
): Promise<string | undefined> => {
  if (!image) return undefined;

  const { url, error } = await uploadProfileImage(image, filePrefix);
  if (error || !url) {
    console.error('Upload error:', error);
    return undefined;
  }

  return url;
};

export const useCompleteProfileOnboarding = () => {
  const router = useRouter();
  const draft = useOnboardingProfileDraft();
  const authReady = isAuthReady();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('Profile updated successfully.');
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'banner'>('avatar');
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearSuccessTimeout = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSuccessTimeout();
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      setIsCheckingSetup(false);
      return;
    }

    let active = true;
    const checkSetup = async () => {
      try {
        const state = await resolveOnboardingState();
        if (!active || !mountedRef.current) return;

        if (state.status !== 'optional-profile-details') {
          router.replace(getRouteForOnboardingState(state));
          return;
        }

        setIsCheckingSetup(false);
      } catch {
        if (active && mountedRef.current) {
          router.replace(ROUTES.onboardingRecovery);
        }
      }
    };

    void checkSetup();
    return () => {
      active = false;
    };
  }, [authReady, router]);

  const finishAfter = (state: NonNullable<Awaited<ReturnType<typeof saveOptionalProfileDetails>>['data']>, delay: number) => {
    successTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setShowSuccess(false);
        draft.clearDraft();
        router.replace(getRouteForOnboardingState(state));
        successTimeoutRef.current = null;
      }
    }, delay);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const uploadedAvatarUrl = await uploadImageIfNeeded(draft.profileImage, 'avatar');
      const uploadedBannerUrl = await uploadImageIfNeeded(draft.bannerImage, 'banner');

      if (draft.profileImage && !uploadedAvatarUrl) {
        throw new Error('Failed to upload the new profile picture. Please try again.');
      }

      if (draft.bannerImage && !uploadedBannerUrl) {
        throw new Error('Failed to upload the new banner image. Please try again.');
      }

      const { data: state, error } = await saveOptionalProfileDetails({
        bio: draft.bio?.trim() || null,
        instagram: draft.instagram?.trim() || null,
        x_twitter: draft.twitter?.trim() || null,
        linkedin: draft.linkedin?.trim() || null,
        profile_pic_url: uploadedAvatarUrl ?? draft.profileImageUrl ?? null,
        banner_url: uploadedBannerUrl ?? draft.bannerImageUrl ?? null,
      });

      if (error || !state) {
        throw error ?? new Error('Failed to save optional profile details');
      }

      if (uploadedAvatarUrl) {
        draft.setProfileImage(null);
        draft.setProfileImageUrl(uploadedAvatarUrl);
      }

      if (uploadedBannerUrl) {
        draft.setBannerImage(null);
        draft.setBannerImageUrl(uploadedBannerUrl);
      }

      clearSuccessTimeout();
      if (mountedRef.current) {
        setSuccessMessage('Profile updated successfully.');
        setShowSuccess(true);
        finishAfter(state, 800);
      }
    } catch (error) {
      if (mountedRef.current) {
        setShowSuccess(false);
        setErrorMessage(getFriendlyOnboardingError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleSkip = async () => {
    if (isSaving) return;
    clearSuccessTimeout();
    setShowSuccess(false);
    setErrorMessage('');
    setIsSaving(true);

    try {
      const { data: state, error } = await skipOptionalProfileDetails();
      if (error || !state) {
        throw error ?? new Error('Failed to skip optional details');
      }

      if (mountedRef.current) {
        setSuccessMessage('Optional details skipped.');
        setShowSuccess(true);
        finishAfter(state, 500);
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(getFriendlyOnboardingError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleImageSelected = (image: CompressedImage | null) => {
    if (uploadType === 'avatar') {
      draft.setProfileImage(image);
      if (!image) draft.setProfileImageUrl(null);
    } else {
      draft.setBannerImage(image);
      if (!image) draft.setBannerImageUrl(null);
    }
  };

  const handleRemoveImage = () => {
    if (uploadType === 'avatar') {
      draft.setProfileImage(null);
      draft.setProfileImageUrl(null);
    } else {
      draft.setBannerImage(null);
      draft.setBannerImageUrl(null);
    }
  };

  const openImageDialog = (type: 'avatar' | 'banner') => {
    setUploadType(type);
    setShowImageUploadDialog(true);
  };

  return {
    ...draft,
    authReady,
    errorMessage,
    handleBack: () => router.replace(ROUTES.onboardingBasic),
    handleImageSelected,
    handleRemoveImage,
    handleSave,
    handleSkip,
    isCheckingSetup,
    isSaving,
    openBannerMenu: () => openImageDialog('banner'),
    openProfileMenu: () => openImageDialog('avatar'),
    setShowImageUploadDialog,
    showImageUploadDialog,
    showSuccess,
    successMessage,
    uploadType,
  };
};
