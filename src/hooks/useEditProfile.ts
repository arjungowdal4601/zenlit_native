import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '../contexts/ProfileContext';
import { getCurrentUserProfile } from '../services/profileService';
import type { CompressedImage } from '../utils/imageCompression';
import { saveEditProfileChanges } from './saveEditProfileChanges';

export type EditProfileToast = {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};
export type EditProfileUploadType = 'avatar' | 'banner';
export type EditProfileSocialField = 'instagram' | 'twitter' | 'linkedin';

export type EditProfileDraft = {
  displayName: string;
  bio: string;
  bannerImage: ImageSourcePropType | null;
  profileImage: string | null;
  instagram: string;
  twitter: string;
  linkedin: string;
};

export type EditProfilePendingImages = {
  bannerRemoval: boolean;
  profileRemoval: boolean;
  bannerUpload: CompressedImage | null;
  avatarUpload: CompressedImage | null;
  oldBannerUrl: string | null;
  oldProfileUrl: string | null;
};

const emptyDraft: EditProfileDraft = {
  displayName: '',
  bio: '',
  bannerImage: null,
  profileImage: null,
  instagram: '',
  twitter: '',
  linkedin: '',
};

const emptyPending: EditProfilePendingImages = {
  bannerRemoval: false,
  profileRemoval: false,
  bannerUpload: null,
  avatarUpload: null,
  oldBannerUrl: null,
  oldProfileUrl: null,
};

export const useEditProfile = () => {
  const router = useRouter();
  const { refresh } = useProfile();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EditProfileDraft>(emptyDraft);
  const [original, setOriginal] = useState<EditProfileDraft>(emptyDraft);
  const [pending, setPending] = useState<EditProfilePendingImages>(emptyPending);
  const [toast, setToast] = useState<EditProfileToast | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<EditProfileUploadType>('avatar');
  const [activeSocialModal, setActiveSocialModal] = useState<EditProfileSocialField | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const clearToastTimeout = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const showToastMessage = useCallback(
    (message: string, type: EditProfileToast['type'] = 'info', duration = 2500) => {
      clearToastTimeout();
      if (!mountedRef.current) {
        return;
      }
      setToast({ message, type });
      if (duration > 0) {
        toastTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setToast(null);
            toastTimeoutRef.current = null;
          }
        }, duration);
      }
    },
    [clearToastTimeout],
  );

  useEffect(() => {
    mountedRef.current = true;
    const loadUserData = async () => {
      setLoading(true);
      try {
        const { profile, socialLinks } = await getCurrentUserProfile();
        if (profile && mountedRef.current) {
          const nextDraft: EditProfileDraft = {
            displayName: profile.display_name,
            bio: socialLinks?.bio || '',
            profileImage: socialLinks?.profile_pic_url || null,
            bannerImage: socialLinks?.banner_url ? { uri: socialLinks.banner_url } : null,
            instagram: socialLinks?.instagram || '',
            twitter: socialLinks?.x_twitter || '',
            linkedin: socialLinks?.linkedin || '',
          };
          setDraft(nextDraft);
          setOriginal(nextDraft);
          setPending({
            ...emptyPending,
            oldProfileUrl: nextDraft.profileImage,
            oldBannerUrl: socialLinks?.banner_url || null,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadUserData();
    return () => {
      mountedRef.current = false;
      clearSuccessTimeout();
      clearToastTimeout();
    };
  }, [clearSuccessTimeout, clearToastTimeout]);

  const setDraftField = useCallback(<K extends keyof EditProfileDraft>(
    key: K,
    value: EditProfileDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    clearSuccessTimeout();
    setIsSaving(true);

    try {
      const { nextDraft, oldProfileUrl, oldBannerUrl, warnings } = await saveEditProfileChanges({
        draft,
        originalDisplayName: original.displayName,
        pending,
        refresh,
      });

      setDraft(nextDraft);
      setOriginal(nextDraft);
      setPending({ ...emptyPending, oldProfileUrl, oldBannerUrl });
      showToastMessage('Profile updated successfully.', 'success');
      if (warnings.length > 0) {
        setTimeout(() => mountedRef.current && showToastMessage(warnings.join(' '), 'warning', 4000), 2600);
      }
      successTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          router.back();
          successTimeoutRef.current = null;
        }
      }, warnings.length > 0 ? 4500 : 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      clearSuccessTimeout();
      showToastMessage(
        typeof error?.message === 'string' ? error.message : 'Failed to update profile. Please try again.',
        'error',
        3500,
      );
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setDraft(original);
    setPending((current) => ({
      ...emptyPending,
      oldBannerUrl: current.oldBannerUrl,
      oldProfileUrl: current.oldProfileUrl,
    }));
    clearToastTimeout();
    setToast(null);
    router.back();
  };

  const openImageDialog = (type: EditProfileUploadType) => {
    setUploadType(type);
    setShowImageUploadDialog(true);
  };

  const handleImageSelected = (image: CompressedImage | null) => {
    const hasImage = Boolean(image);
    if (uploadType === 'avatar') {
      setDraftField('profileImage', image?.uri ?? null);
      setPending((current) => ({ ...current, avatarUpload: image, profileRemoval: !hasImage }));
      showToastMessage(hasImage ? 'New profile picture selected. Save to apply.' : 'Profile picture removed (pending). Save to confirm.', 'info');
      return;
    }
    setDraftField('bannerImage', image ? { uri: image.uri } : null);
    setPending((current) => ({ ...current, bannerUpload: image, bannerRemoval: !hasImage }));
    showToastMessage(hasImage ? 'New banner image selected. Save to apply.' : 'Banner image removed (pending). Save to confirm.', 'info');
  };

  return {
    loading,
    draft,
    toast,
    isSaving,
    uploadType,
    showImageUploadDialog,
    activeSocialModal,
    setDraftField,
    handleSave,
    handleCancel,
    handleBack: handleCancel,
    openBannerMenu: () => openImageDialog('banner'),
    openProfileMenu: () => openImageDialog('avatar'),
    openSocialModal: setActiveSocialModal,
    closeSocialModal: () => setActiveSocialModal(null),
    closeImageUploadDialog: () => setShowImageUploadDialog(false),
    handleImageSelected,
    handleImageRemove: () => handleImageSelected(null),
  };
};

export type EditProfileController = ReturnType<typeof useEditProfile>;
