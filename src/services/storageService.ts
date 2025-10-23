import { supabase } from '../lib/supabase';
import type { StorageBucket } from '../lib/types';

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

export async function uploadImage(
  fileOrUri: Blob | File | ArrayBuffer | Uint8Array | string,
  bucket: StorageBucket,
  fileName: string,
  options?: { contentType?: string }
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { url: null, error: new Error('Not authenticated') };
    }

    let fileToUpload: Blob | File | ArrayBuffer | Uint8Array;

    if (typeof fileOrUri === 'string') {
      const response = await fetch(fileOrUri);
      const blob = await response.blob();
      fileToUpload = blob;
    } else {
      fileToUpload = fileOrUri;
    }

    const uploadPayload =
      fileToUpload instanceof Uint8Array
        ? fileToUpload.buffer
        : fileToUpload;

    const uploadOptions: { upsert: boolean; contentType?: string } = {
      upsert: true,
    };

    if (options?.contentType) {
      uploadOptions.contentType = options.contentType;
    }

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadPayload as any, uploadOptions);

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}
