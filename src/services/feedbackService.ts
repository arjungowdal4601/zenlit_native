import { supabase } from '../lib/supabase';
import type { StoredImage } from '../types/stored-image';

export const submitFeedback = async (
  message: string,
  image?: StoredImage | null,
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

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      message: trimmed,
      image_url: image?.publicUrl ?? null,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};
