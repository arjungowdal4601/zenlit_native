import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  saveOptionalProfileDetails,
  skipOptionalProfileDetails,
} from '../services/onboardingService';
import type { CompressedImage } from '../utils/imageCompression';
import { getFriendlyOnboardingError } from '../utils/onboardingErrors';
import { getRouteForOnboardingState } from '../utils/onboardingState';
import { publishOnboardingState } from '../utils/onboardingStateSync';
import { uploadProfileImagesWithCleanup } from '../utils/profileImageUploads';

export const useCompleteProfileOnboarding = () => {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [bannerImage, setBannerImage] = useState<CompressedImage | null>(null);
  const [profileImage, setProfileImage] = useState<CompressedImage | null>(null);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
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

  const clearDraft = () => {
    setBio('');
    setBannerImage(null);
    setProfileImage(null);
    setInstagram('');
    setTwitter('');
    setLinkedin('');
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const uploadedImages = await uploadProfileImagesWithCleanup({
        avatarImage: profileImage,
        bannerImage,
      });

      try {
        const result = await saveOptionalProfileDetails({
          bio: bio.trim() || null,
          instagram: instagram.trim() || null,
          x_twitter: twitter.trim() || null,
          linkedin: linkedin.trim() || null,
          profile_pic_url: uploadedImages.avatarUrl ?? null,
          banner_url: uploadedImages.bannerUrl ?? null,
        });
        if (result.error || !result.data) {
          throw result.error ?? new Error('Failed to save optional profile details');
        }
        if (mountedRef.current) {
          if (!publishOnboardingState(result.data)) {
            router.replace(getRouteForOnboardingState(result.data));
          }
        }
      } catch (error) {
        await uploadedImages.cleanupUploadedImages();
        throw error;
      }

      if (mountedRef.current) {
        clearDraft();
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
        clearDraft();
        if (!publishOnboardingState(data)) {
          router.replace(getRouteForOnboardingState(data));
        }
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
      setProfileImage(image);
    } else {
      setBannerImage(image);
    }
  };

  const handleRemoveImage = () => {
    if (uploadType === 'avatar') {
      setProfileImage(null);
    } else {
      setBannerImage(null);
    }
  };

  const openImageDialog = (type: 'avatar' | 'banner') => {
    setUploadType(type);
    setShowImageUploadDialog(true);
  };

  return {
    bannerImage,
    bio,
    errorMessage,
    handleImageSelected,
    handleRemoveImage,
    handleSave,
    handleSkip,
    instagram,
    isSaving,
    linkedin,
    openBannerMenu: () => openImageDialog('banner'),
    openProfileMenu: () => openImageDialog('avatar'),
    profileImage,
    setBio,
    setInstagram,
    setLinkedin,
    setShowImageUploadDialog,
    setTwitter,
    showImageUploadDialog,
    twitter,
    uploadType,
  };
};
