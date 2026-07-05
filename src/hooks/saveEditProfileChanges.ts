import { getCurrentUser } from '../services/authService';
import { updateProfileDisplayName, updateSocialLinks } from '../services/profileService';
import { deleteImageFromStorage, uploadProfileImage } from '../services/storageService';
import type { CompressedImage } from '../utils/imageCompression';
import type {
  EditProfileDraft,
  EditProfilePendingImages,
  EditProfileUploadType,
} from './useEditProfile';

type SaveEditProfileChangesInput = {
  draft: EditProfileDraft;
  originalDisplayName: string;
  pending: EditProfilePendingImages;
  refresh: (force?: boolean) => Promise<void>;
};

type SaveEditProfileChangesResult = {
  nextDraft: EditProfileDraft;
  oldProfileUrl: string | null;
  oldBannerUrl: string | null;
  warnings: string[];
};

const uploadImageIfNeeded = async (
  image: CompressedImage | null,
  filePrefix: EditProfileUploadType,
): Promise<string | undefined> => {
  try {
    if (!image) {
      return undefined;
    }

    const { url, error } = await uploadProfileImage(image, filePrefix);
    if (error || !url) {
      throw error ?? new Error('Upload failed');
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[profile-upload/${filePrefix}]`, image.metadata);
    }
    return url;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return undefined;
  }
};

export const saveEditProfileChanges = async ({
  draft,
  originalDisplayName,
  pending,
  refresh,
}: SaveEditProfileChangesInput): Promise<SaveEditProfileChangesResult> => {
  let uploadedAvatarUrl: string | undefined;
  let uploadedBannerUrl: string | undefined;
  let socialLinksUpdated = false;
  const previousAvatarUrl = pending.oldProfileUrl;
  const previousBannerUrl = pending.oldBannerUrl;

  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const trimmedDisplayName = draft.displayName.trim();
    const trimmedBio = draft.bio.trim();
    const trimmedInstagram = draft.instagram.trim();
    const trimmedTwitter = draft.twitter.trim();
    const trimmedLinkedin = draft.linkedin.trim();
    if (pending.avatarUpload) {
      uploadedAvatarUrl = await uploadImageIfNeeded(pending.avatarUpload, 'avatar');
      if (!uploadedAvatarUrl) {
        throw new Error('Failed to upload the new profile picture. Please try again.');
      }
    }
    if (pending.bannerUpload) {
      uploadedBannerUrl = await uploadImageIfNeeded(pending.bannerUpload, 'banner');
      if (!uploadedBannerUrl) {
        throw new Error('Failed to upload the new banner image. Please try again.');
      }
    }

    const payload: Record<string, any> = {
      bio: trimmedBio || null,
      instagram: trimmedInstagram || null,
      x_twitter: trimmedTwitter || null,
      linkedin: trimmedLinkedin || null,
    };
    if (pending.profileRemoval) {
      payload.profile_pic_url = null;
    } else if (uploadedAvatarUrl !== undefined) {
      payload.profile_pic_url = uploadedAvatarUrl;
    }
    if (pending.bannerRemoval) {
      payload.banner_url = null;
    } else if (uploadedBannerUrl !== undefined) {
      payload.banner_url = uploadedBannerUrl;
    }

    const { error: updateError, socialLinks } = await updateSocialLinks(payload);
    if (updateError) {
      throw updateError;
    }
    socialLinksUpdated = true;

    const nextProfileUrl = pending.profileRemoval
      ? null
      : uploadedAvatarUrl ?? socialLinks?.profile_pic_url ?? previousAvatarUrl ?? null;
    const nextBannerUrl = pending.bannerRemoval
      ? null
      : uploadedBannerUrl ?? socialLinks?.banner_url ?? previousBannerUrl ?? null;
    const nextDraft: EditProfileDraft = {
      displayName: trimmedDisplayName,
      bio: trimmedBio,
      instagram: trimmedInstagram,
      twitter: trimmedTwitter,
      linkedin: trimmedLinkedin,
      profileImage: nextProfileUrl,
      bannerImage: nextBannerUrl ? { uri: nextBannerUrl } : null,
    };

    const warnings: string[] = [];
    const deleteWithRetry = async (url: string | null, label: 'profile picture' | 'banner image') => {
      if (!url) {
        return;
      }
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { success } = await deleteImageFromStorage(url, 'profile-images');
        if (success) {
          return;
        }
      }
      console.warn(`Failed to delete ${label}`);
      warnings.push(`We couldn't remove your previous ${label}. It may remain temporarily.`);
    };

    if (pending.profileRemoval || (uploadedAvatarUrl && previousAvatarUrl && previousAvatarUrl !== uploadedAvatarUrl)) {
      await deleteWithRetry(previousAvatarUrl, 'profile picture');
    }
    if (pending.bannerRemoval || (uploadedBannerUrl && previousBannerUrl && previousBannerUrl !== uploadedBannerUrl)) {
      await deleteWithRetry(previousBannerUrl, 'banner image');
    }
    if (trimmedDisplayName !== originalDisplayName) {
      const { error: nameError } = await updateProfileDisplayName(trimmedDisplayName);
      if (nameError) {
        throw nameError;
      }
    }

    await refresh(true);
    return { nextDraft, oldProfileUrl: nextProfileUrl, oldBannerUrl: nextBannerUrl, warnings };
  } catch (error) {
    if (!socialLinksUpdated) {
      for (const target of [
        { url: uploadedAvatarUrl, previous: previousAvatarUrl, label: 'profile picture' },
        { url: uploadedBannerUrl, previous: previousBannerUrl, label: 'banner image' },
      ] as const) {
        if (target.url && target.url !== target.previous) {
          const { success, error: cleanupError } = await deleteImageFromStorage(target.url, 'profile-images');
          if (!success && cleanupError) {
            console.warn(`Cleanup failed for pending ${target.label}:`, cleanupError);
          }
        }
      }
    }
    throw error;
  }
};
