import { deleteStoredImage } from '../services/storageService';
import type { StoredImage } from '../types/stored-image';

type UploadedProfileImage = {
  label: 'profile picture' | 'banner image';
  image?: StoredImage | null;
};

type UploadProfileImagesInput = {
  avatarImage?: StoredImage | null;
  bannerImage?: StoredImage | null;
};

export const cleanupUploadedProfileImages = async (targets: UploadedProfileImage[]) => {
  for (const target of targets) {
    if (!target.image) {
      continue;
    }

    const { success, error } = await deleteStoredImage(target.image);
    if (!success) {
      console.warn(`Cleanup failed for pending ${target.label}:`, error);
    }
  }
};

export const uploadProfileImagesWithCleanup = async ({
  avatarImage,
  bannerImage,
}: UploadProfileImagesInput) => {
  const uploadedImages: UploadedProfileImage[] = [
    { image: avatarImage, label: 'profile picture' },
    { image: bannerImage, label: 'banner image' },
  ];

  return {
    avatarUrl: avatarImage?.publicUrl,
    bannerUrl: bannerImage?.publicUrl,
    cleanupUploadedImages: () => cleanupUploadedProfileImages(uploadedImages),
  };
};
