import { deleteImageFromStorage, uploadProfileImage } from '../services/storageService';
import type { CompressedImage } from './imageCompression';

type ProfileImageUploadKind = 'avatar' | 'banner';

type UploadedProfileImage = {
  label: 'profile picture' | 'banner image';
  previousUrl?: string | null;
  url?: string | null;
};

type UploadProfileImagesInput = {
  avatarImage?: CompressedImage | null;
  bannerImage?: CompressedImage | null;
  previousAvatarUrl?: string | null;
  previousBannerUrl?: string | null;
};

const imageLabelFor = (kind: ProfileImageUploadKind): UploadedProfileImage['label'] =>
  kind === 'avatar' ? 'profile picture' : 'banner image';

const uploadOneProfileImage = async (
  image: CompressedImage | null | undefined,
  kind: ProfileImageUploadKind,
) => {
  if (!image) return undefined;

  const { url, error } = await uploadProfileImage(image, kind);
  if (error || !url) {
    console.error(`Failed to upload ${imageLabelFor(kind)}:`, error);
    throw new Error(`Failed to upload the new ${imageLabelFor(kind)}. Please try again.`);
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[profile-upload/${kind}]`, image.metadata);
  }

  return url;
};

export const cleanupUploadedProfileImages = async (targets: UploadedProfileImage[]) => {
  for (const target of targets) {
    if (!target.url || target.url === target.previousUrl) {
      continue;
    }

    const { success, error } = await deleteImageFromStorage(target.url, 'profile-images');
    if (!success) {
      console.warn(`Cleanup failed for pending ${target.label}:`, error);
    }
  }
};

export const uploadProfileImagesWithCleanup = async ({
  avatarImage,
  bannerImage,
  previousAvatarUrl,
  previousBannerUrl,
}: UploadProfileImagesInput) => {
  const uploadedImages: UploadedProfileImage[] = [];

  try {
    const avatarUrl = await uploadOneProfileImage(avatarImage, 'avatar');
    if (avatarUrl) {
      uploadedImages.push({
        label: 'profile picture',
        previousUrl: previousAvatarUrl,
        url: avatarUrl,
      });
    }

    const bannerUrl = await uploadOneProfileImage(bannerImage, 'banner');
    if (bannerUrl) {
      uploadedImages.push({
        label: 'banner image',
        previousUrl: previousBannerUrl,
        url: bannerUrl,
      });
    }

    return {
      avatarUrl,
      bannerUrl,
      cleanupUploadedImages: () => cleanupUploadedProfileImages(uploadedImages),
    };
  } catch (error) {
    await cleanupUploadedProfileImages(uploadedImages);
    throw error;
  }
};
