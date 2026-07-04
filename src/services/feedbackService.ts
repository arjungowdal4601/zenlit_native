import type { CompressedImage } from '../utils/imageCompression';
import { uploadCompressedImage } from './storageService';
import { supabase } from '../lib/supabase';

export const submitFeedback = async (
  message: string,
  image?: CompressedImage | null,
): Promise<{ error: Error | null }> => {
  try {
    const trimmed = message.trim();
    if (!trimmed) {
      return { error: new Error('Feedback text is required') };
    }

    const { data, error: userError } = await supabase.auth.getUser();
    const user = data.user;
    if (userError || !user) {
      return { error: new Error('User not authenticated') };
    }

    let imageUrl: string | null = null;
    if (image) {
      const uploaded = await uploadCompressedImage(image, 'feedback-images', 'feedback');
      if (uploaded.error || !uploaded.url) {
        return { error: new Error('Failed to upload your screenshot. Please try again.') };
      }
      imageUrl = uploaded.url;
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      message: trimmed,
      image_url: imageUrl,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};
