import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { useOnboardingProfileDraft } from '../contexts/OnboardingProfileDraftContext';
import {
  saveOptionalProfileDetails,
  skipOptionalProfileDetails,
} from '../services/onboardingService';
import type { CompressedImage } from '../utils/imageCompression';
import { getFriendlyOnboardingError } from '../utils/onboardingErrors';
import { ROUTES } from '../utils/onboardingState';
import { uploadProfileImagesWithCleanup } from '../utils/profileImageUploads';

export const useCompleteProfileOnboarding = () => {
  const router = useRouter();
  const draft = useOnboardingProfileDraft();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'banner'>('avatar');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const uploadedImages = await uploadProfileImagesWithCleanup({
        avatarImage: draft.profileImage,
        bannerImage: draft.bannerImage,
        previousAvatarUrl: draft.profileImageUrl,
        previousBannerUrl: draft.bannerImageUrl,
      });

      try {
        const result = await saveOptionalProfileDetails({
          bio: draft.bio?.trim() || null,
          instagram: draft.instagram?.trim() || null,
          x_twitter: draft.twitter?.trim() || null,
          linkedin: draft.linkedin?.trim() || null,
          profile_pic_url: uploadedImages.avatarUrl ?? draft.profileImageUrl ?? null,
          banner_url: uploadedImages.bannerUrl ?? draft.bannerImageUrl ?? null,
        });
        if (result.error || !result.data) {
          throw result.error ?? new Error('Failed to save optional profile details');
        }
      } catch (error) {
        await uploadedImages.cleanupUploadedImages();
        throw error;
      }

      if (mountedRef.current) {
        draft.clearDraft();
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

  const handleSkip = async () => {
    if (isSaving) return;
    setErrorMessage('');
    setIsSaving(true);

    try {
      const { data, error } = await skipOptionalProfileDetails();
      if (error || !data) {
        throw error ?? new Error('Failed to skip optional details');
      }

      if (mountedRef.current) {
        draft.clearDraft();
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
    errorMessage,
    handleBack: () => router.replace(ROUTES.onboardingBasic),
    handleImageSelected,
    handleRemoveImage,
    handleSave,
    handleSkip,
    isSaving,
    openBannerMenu: () => openImageDialog('banner'),
    openProfileMenu: () => openImageDialog('avatar'),
    setShowImageUploadDialog,
    showImageUploadDialog,
    uploadType,
  };
};
