import { getCurrentUser } from '../services/authService';
import { updateProfileDisplayName, updateSocialLinks } from '../services/profileService';
import { deleteImageFromStorage } from '../services/storageService';
import type {
  EditProfileDraft,
  EditProfilePendingImages,
} from './useEditProfile';

type SaveEditProfileChangesInput = {
  draft: EditProfileDraft;
  originalDisplayName: string;
  pending: EditProfilePendingImages;
  commitPendingImages?: () => void;
  refresh: (force?: boolean) => Promise<void>;
};

type SaveEditProfileChangesResult = {
  nextDraft: EditProfileDraft;
  oldProfileUrl: string | null;
  oldBannerUrl: string | null;
  warnings: string[];
};

export const saveEditProfileChanges = async ({
  draft,
  originalDisplayName,
  pending,
  commitPendingImages,
  refresh,
}: SaveEditProfileChangesInput): Promise<SaveEditProfileChangesResult> => {
  const previousAvatarUrl = pending.oldProfileUrl;
  const previousBannerUrl = pending.oldBannerUrl;

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const trimmedDisplayName = draft.displayName.trim();
  const trimmedBio = draft.bio.trim();
  const trimmedInstagram = draft.instagram.trim();
  const trimmedTwitter = draft.twitter.trim();
  const trimmedLinkedin = draft.linkedin.trim();
  const uploadedAvatarUrl = pending.avatarUpload?.publicUrl;
  const uploadedBannerUrl = pending.bannerUpload?.publicUrl;

  if (trimmedDisplayName !== originalDisplayName) {
    const { error: nameError } = await updateProfileDisplayName(trimmedDisplayName);
    if (nameError) {
      throw nameError;
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
  commitPendingImages?.();

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

  await refresh(true);
  return { nextDraft, oldProfileUrl: nextProfileUrl, oldBannerUrl: nextBannerUrl, warnings };
};
