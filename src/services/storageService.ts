import { supabase } from '../lib/supabase';
import type { ImageUploadTarget, StorageBucket, StoredImage } from '../types/stored-image';
import {
  compressImage,
  prepareCameraCapture,
  type PreparedImage,
} from '../utils/imageCompression';
import {
  queuePendingUploadDeletion,
  registerPendingUpload,
  removePendingUploadRecord,
} from './pendingUploadLedger';

type UploadImageOptions = {
  width?: number;
  height?: number;
  timestamp?: number;
  uploadId?: string;
  source?: 'camera' | 'gallery';
  onProgress?: (phase: 'preparing' | 'uploading') => void;
};

const makeUuid = (): string => {
  const cryptoValue = globalThis.crypto;
  if (cryptoValue?.randomUUID) return cryptoValue.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoValue?.getRandomValues) {
    cryptoValue.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};

const sanitizePathToken = (value: string, fallback: string) => {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || fallback;
};

const requireAuthenticatedUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user;
};

const uploadPreparedImage = async (
  image: Pick<PreparedImage, 'blob' | 'width' | 'height' | 'size'>,
  target: ImageUploadTarget,
  options: UploadImageOptions = {},
): Promise<{ image: StoredImage | null; error: Error | null }> => {
  try {
    const user = await requireAuthenticatedUser();
    const timestamp = options.timestamp ?? Date.now();
    const uploadId = options.uploadId ?? makeUuid();
    const safePrefix = sanitizePathToken(target.prefix, 'image');
    const safeUploadId = sanitizePathToken(uploadId, makeUuid());
    const requestedPath = `${user.id}/${safePrefix}-${timestamp}-${safeUploadId}.jpg`;
    const bucket = supabase.storage.from(target.bucket);
    const { data: uploadData, error: uploadError } = await bucket.upload(
      requestedPath,
      image.blob,
      { contentType: 'image/jpeg', upsert: false },
    );

    if (uploadError) {
      return { image: null, error: uploadError };
    }

    const objectPath = uploadData?.path;
    if (!objectPath || !objectPath.startsWith(`${user.id}/`)) {
      await bucket.remove([requestedPath]);
      return { image: null, error: new Error('Storage did not return a valid object path') };
    }

    const { data: publicUrlData } = bucket.getPublicUrl(objectPath);
    if (!publicUrlData?.publicUrl) {
      await bucket.remove([objectPath]);
      return { image: null, error: new Error('Storage did not return a public image URL') };
    }

    const storedImage: StoredImage = {
      uploadId,
      publicUrl: publicUrlData.publicUrl,
      bucket: target.bucket,
      objectPath,
      width: image.width || options.width || 0,
      height: image.height || options.height || 0,
      size: image.blob.size || image.size,
      mimeType: 'image/jpeg',
    };
    registerPendingUpload(user.id, storedImage);
    return { image: storedImage, error: null };
  } catch (error) {
    return { image: null, error: error as Error };
  }
};

export async function uploadImageFromUri(
  uri: string,
  target: ImageUploadTarget,
  options: UploadImageOptions = {},
): Promise<{ image: StoredImage | null; error: Error | null }> {
  let prepared: PreparedImage | null = null;
  try {
    options.onProgress?.('preparing');
    prepared = options.source === 'camera'
      ? await prepareCameraCapture(uri, {
          width: options.width ?? 0,
          height: options.height ?? 0,
          quality: 0.9,
        })
      : await compressImage(uri);
    options.onProgress?.('uploading');
    return await uploadPreparedImage(prepared, target, options);
  } catch (error) {
    const separator = uri.indexOf(':');
    console.error('[ImageUpload] Image preparation failed', {
      source: options.source ?? 'unknown',
      uriScheme: separator > 0 ? uri.slice(0, separator) : 'unknown',
      width: options.width ?? 0,
      height: options.height ?? 0,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return { image: null, error: error as Error };
  } finally {
    prepared?.cleanup();
  }
}

const makeDeletionLedgerImage = (
  bucket: StorageBucket,
  objectPath: string,
  publicUrl = '',
): StoredImage => ({
  uploadId: `delete-${makeUuid()}`,
  publicUrl,
  bucket,
  objectPath,
  width: 0,
  height: 0,
  size: 0,
  mimeType: 'image/jpeg',
});

export async function deleteStoredImage(
  image: Pick<StoredImage, 'bucket' | 'objectPath'>,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const user = await requireAuthenticatedUser();
    if (!image.objectPath.startsWith(`${user.id}/`) || image.objectPath.includes('..')) {
      return {
        success: false,
        error: new Error('Storage object path is not owned by the authenticated user'),
      };
    }

    const ledgerImage = makeDeletionLedgerImage(image.bucket, image.objectPath);
    queuePendingUploadDeletion(user.id, ledgerImage);
    const { error } = await supabase.storage.from(image.bucket).remove([image.objectPath]);
    if (error) {
      return { success: false, error };
    }

    removePendingUploadRecord(ledgerImage);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

const objectPathFromPublicUrl = (
  imageUrl: string,
  bucket: StorageBucket,
): string | null => {
  try {
    const url = new URL(imageUrl);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/render/image/public/${bucket}/`,
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    if (!marker) return null;
    const encodedPath = url.pathname.slice(url.pathname.indexOf(marker) + marker.length);
    const objectPath = decodeURIComponent(encodedPath);
    return objectPath && !objectPath.includes('..') ? objectPath : null;
  } catch {
    return null;
  }
};

/**
 * Compatibility helper for already-committed legacy rows that only retain a
 * public URL. New pending-image flows delete by the StoredImage objectPath.
 */
export async function deleteImageFromStorage(
  imageUrl: string | null,
  bucket: StorageBucket,
): Promise<{ success: boolean; error: Error | null }> {
  if (!imageUrl) return { success: true, error: null };
  const objectPath = objectPathFromPublicUrl(imageUrl, bucket);
  if (!objectPath) {
    return { success: false, error: new Error('Could not identify the Storage object path') };
  }
  return deleteStoredImage({ bucket, objectPath });
}
