import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  saveOptionalProfileDetails,
  skipOptionalProfileDetails,
} from '../services/onboardingService';
import type { StoredImage } from '../types/stored-image';
import { getFriendlyOnboardingError } from '../utils/onboardingErrors';
import { getRouteForOnboardingState } from '../utils/onboardingState';
import { publishOnboardingState } from '../utils/onboardingStateSync';
import { usePendingUpload } from './usePendingUpload';

export const useCompleteProfileOnboarding = () => {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const bannerUpload = usePendingUpload();
  const profileUpload = usePendingUpload();
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
    setInstagram('');
    setTwitter('');
    setLinkedin('');
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');
    const releaseProfilePersistence = profileUpload.beginPersistence();
    const releaseBannerPersistence = bannerUpload.beginPersistence();

    try {
      const result = await saveOptionalProfileDetails({
        bio: bio.trim() || null,
        instagram: instagram.trim() || null,
        x_twitter: twitter.trim() || null,
        linkedin: linkedin.trim() || null,
        profile_pic_url: profileUpload.image?.publicUrl ?? null,
        banner_url: bannerUpload.image?.publicUrl ?? null,
      });
      if (result.error || !result.data) {
        throw result.error ?? new Error('Failed to save optional profile details');
      }

      profileUpload.commit();
      bannerUpload.commit();
      if (mountedRef.current) {
        clearDraft();
        if (!publishOnboardingState(result.data)) {
          router.replace(getRouteForOnboardingState(result.data));
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(getFriendlyOnboardingError(error));
      }
    } finally {
      releaseProfilePersistence();
      releaseBannerPersistence();
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

      await Promise.all([profileUpload.discard(), bannerUpload.discard()]);
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

  const handleImageUploaded = async (image: StoredImage) => {
    if (uploadType === 'avatar') {
      await profileUpload.replace(image);
    } else {
      await bannerUpload.replace(image);
    }
  };

  const handleRemoveImage = async () => {
    if (isSaving) return;
    if (uploadType === 'avatar') {
      await profileUpload.discard();
    } else {
      await bannerUpload.discard();
    }
  };

  const openImageDialog = (type: 'avatar' | 'banner') => {
    if (isSaving) return;
    setUploadType(type);
    setShowImageUploadDialog(true);
  };

  return {
    bannerImage: bannerUpload.image,
    bio,
    errorMessage,
    handleImageUploaded,
    handleRemoveImage,
    handleSave,
    handleSkip,
    instagram,
    isSaving,
    linkedin,
    openBannerMenu: () => openImageDialog('banner'),
    openProfileMenu: () => openImageDialog('avatar'),
    profileImage: profileUpload.image,
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
