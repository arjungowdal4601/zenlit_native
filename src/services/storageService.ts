import { supabase } from '../lib/supabase';
import type { StorageBucket } from '../lib/types';
import {
  base64ToUint8Array,
  compressImage,
  MAX_IMAGE_SIZE_BYTES,
  type CompressedImage,
} from '../utils/imageCompression';

type ProfileImageKind = 'avatar' | 'banner';

type UploadCompressedImageOptions = {
  timestamp?: number;
};

const mimeToExtension = (mimeType: string): string => {
  const lower = mimeType.toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('gif')) return 'gif';
  return 'jpg';
};

const arrayBufferFromBytes = (bytes: Uint8Array): ArrayBuffer => {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const getUploadBody = async (image: CompressedImage): Promise<ArrayBuffer | Blob> => {
  if (image.base64) {
    return arrayBufferFromBytes(base64ToUint8Array(image.base64));
  }

  const response = await fetch(image.uri);
  if (!response.ok) {
    throw new Error('Failed to fetch image for upload');
  }

  return response.arrayBuffer();
};

export async function deleteImageFromStorage(
  imageUrl: string | null,
  bucket: StorageBucket
): Promise<{ success: boolean; error: Error | null }> {
  if (!imageUrl) {
    return { success: true, error: null };
  }

  try {
    const cleanUrl = imageUrl.split('?')[0];
    const regex = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
    const match = cleanUrl.match(regex);
    const filePath = match && match[1] ? match[1] : cleanUrl.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function uploadCompressedImage(
  image: CompressedImage | null | undefined,
  bucketName: StorageBucket,
  filePrefix: string,
  options: UploadCompressedImageOptions = {},
): Promise<{ url: string | null; error: Error | null }> {
  if (!image) {
    return { url: null, error: null };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { url: null, error: new Error('Not authenticated') };
    }

    let workingImage = image;
    if (
      workingImage.size > MAX_IMAGE_SIZE_BYTES ||
      workingImage.metadata.compressedSize > MAX_IMAGE_SIZE_BYTES
    ) {
      workingImage = await compressImage(workingImage.uri);
    }

    const mimeType = workingImage.mimeType || 'image/jpeg';
    const extension = mimeToExtension(mimeType);
    const timestamp = options.timestamp ?? Date.now();
    const filePath = `${user.id}/${filePrefix}-${timestamp}.${extension}`;
    const uploadBody = await getUploadBody(workingImage);
    const bucket = supabase.storage.from(bucketName);

    const { error: uploadError } = await bucket.upload(
      filePath,
      uploadBody as any,
      { contentType: mimeType, upsert: false },
    );

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = bucket.getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

export const uploadProfileImage = (
  image: CompressedImage | null | undefined,
  filePrefix: ProfileImageKind,
  options: UploadCompressedImageOptions = {},
) => uploadCompressedImage(image, 'profile-images', filePrefix, options);
