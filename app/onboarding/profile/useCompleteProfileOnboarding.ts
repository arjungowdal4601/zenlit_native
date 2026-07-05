import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { useOnboardingProfileDraft } from '../../../src/contexts/OnboardingProfileDraftContext';
import { isAuthReady } from '../../../src/services/authService';
import { saveOptionalProfileDetails, skipOptionalProfileDetails } from '../../../src/services/onboardingService';
import { uploadProfileImage } from '../../../src/services/storageService';
import type { CompressedImage } from '../../../src/utils/imageCompression';
import { getFriendlyOnboardingError } from '../../../src/utils/onboardingErrors';
import { getRouteForOnboardingState } from '../../../src/utils/onboardingState';

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
    handleBack: () => router.replace('/onboarding/profile/basic'),
    handleImageSelected,
    handleRemoveImage,
    handleSave,
    handleSkip,
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
