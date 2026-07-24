import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '../contexts/ProfileContext';
import { getCurrentUserProfile } from '../services/profileService';
import type { StoredImage } from '../types/stored-image';
import { saveEditProfileChanges } from './saveEditProfileChanges';
import { usePendingUpload } from './usePendingUpload';
import { useAppToast } from '../components/ui/app-toast';

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
  bannerUpload: StoredImage | null;
  avatarUpload: StoredImage | null;
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
  const { showToast } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EditProfileDraft>(emptyDraft);
  const [original, setOriginal] = useState<EditProfileDraft>(emptyDraft);
  const [pending, setPending] = useState<EditProfilePendingImages>(emptyPending);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<EditProfileUploadType>('avatar');
  const [activeSocialModal, setActiveSocialModal] = useState<EditProfileSocialField | null>(null);
  const avatarUpload = usePendingUpload();
  const bannerUpload = usePendingUpload();
  const mountedRef = useRef(true);

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
    };
  }, []);

  const setDraftField = useCallback(<K extends keyof EditProfileDraft>(
    key: K,
    value: EditProfileDraft[K],
  ) => {
    if (isSaving) return;
    setDraft((current) => ({ ...current, [key]: value }));
  }, [isSaving]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    const releaseAvatarPersistence = avatarUpload.beginPersistence();
    const releaseBannerPersistence = bannerUpload.beginPersistence();

    try {
      const { nextDraft, oldProfileUrl, oldBannerUrl, warnings } = await saveEditProfileChanges({
        draft,
        originalDisplayName: original.displayName,
        pending: {
          ...pending,
          avatarUpload: avatarUpload.image,
          bannerUpload: bannerUpload.image,
        },
        commitPendingImages: () => {
          avatarUpload.commit();
          bannerUpload.commit();
        },
        refresh,
      });

      if (mountedRef.current) {
        setDraft(nextDraft);
        setOriginal(nextDraft);
        setPending({ ...emptyPending, oldProfileUrl, oldBannerUrl });
        if (warnings.length > 0) {
          showToast({
            message: `Profile updated. ${warnings.join(' ')}`,
            tone: 'warning',
          });
        } else {
          showToast({ message: 'Profile updated successfully.', tone: 'success' });
        }
        router.back();
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (mountedRef.current) {
        showToast({
          message: typeof error?.message === 'string'
            ? error.message
            : 'Failed to update profile. Please try again.',
          tone: 'error',
        });
      }
    } finally {
      releaseAvatarPersistence();
      releaseBannerPersistence();
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = async () => {
    if (isSaving) return;
    await Promise.all([avatarUpload.discard(), bannerUpload.discard()]);
    setDraft(original);
    setPending((current) => ({
      ...emptyPending,
      oldBannerUrl: current.oldBannerUrl,
      oldProfileUrl: current.oldProfileUrl,
    }));
    router.back();
  };

  const openImageDialog = (type: EditProfileUploadType) => {
    if (isSaving) return;
    setUploadType(type);
    setShowImageUploadDialog(true);
  };

  const handleImageUploaded = async (image: StoredImage) => {
    if (uploadType === 'avatar') {
      await avatarUpload.replace(image);
      setDraftField('profileImage', image.publicUrl);
      setPending((current) => ({ ...current, avatarUpload: null, profileRemoval: false }));
      showToast({
        message: 'New profile picture uploaded. Save to apply.',
        tone: 'info',
      });
      return;
    }
    await bannerUpload.replace(image);
    setDraftField('bannerImage', { uri: image.publicUrl });
    setPending((current) => ({ ...current, bannerUpload: null, bannerRemoval: false }));
    showToast({
      message: 'New banner image uploaded. Save to apply.',
      tone: 'info',
    });
  };

  const handleImageRemove = async () => {
    if (isSaving) return;
    if (uploadType === 'avatar') {
      await avatarUpload.discard();
      setDraftField('profileImage', null);
      setPending((current) => ({ ...current, avatarUpload: null, profileRemoval: true }));
      showToast({ message: 'Profile picture removed. Save to confirm.', tone: 'info' });
      return;
    }

    await bannerUpload.discard();
    setDraftField('bannerImage', null);
    setPending((current) => ({ ...current, bannerUpload: null, bannerRemoval: true }));
    showToast({ message: 'Banner image removed. Save to confirm.', tone: 'info' });
  };

  return {
    loading,
    draft,
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
    openSocialModal: (field: EditProfileSocialField) => {
      if (!isSaving) setActiveSocialModal(field);
    },
    closeSocialModal: () => setActiveSocialModal(null),
    closeImageUploadDialog: () => setShowImageUploadDialog(false),
    handleImageUploaded,
    handleImageRemove,
  };
};

export type EditProfileController = ReturnType<typeof useEditProfile>;
