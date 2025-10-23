import { supabase } from '../lib/supabase';
import type { Profile, SocialLinks } from '../lib/types';

export async function getCurrentUserProfile(): Promise<{ profile: Profile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { profile: null, socialLinks: null, error: new Error('Not authenticated') };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { profile: null, socialLinks: null, error: profileError };
    }

    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      profile: profile as Profile | null,
      socialLinks: socialLinks as SocialLinks | null,
      error: socialError
    };
  } catch (error) {
    return { profile: null, socialLinks: null, error: error as Error };
  }
}

export async function getProfileById(userId: string): Promise<{ profile: Profile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return { profile: null, socialLinks: null, error: profileError };
    }

    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return {
      profile: profile as Profile | null,
      socialLinks: socialLinks as SocialLinks | null,
      error: socialError
    };
  } catch (error) {
    return { profile: null, socialLinks: null, error: error as Error };
  }
}

export async function updateProfileDisplayName(displayName: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function updateSocialLinks(data: Partial<Omit<SocialLinks, 'id' | 'created_at' | 'updated_at'>>): Promise<{ socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { socialLinks: null, error: new Error('Not authenticated') };
    }

    const { data: result, error } = await supabase
      .from('social_links')
      .upsert({
        id: user.id,
        ...data,
      })
      .select()
      .single();

    if (error) {
      return { socialLinks: null, error };
    }

    return { socialLinks: result as SocialLinks, error: null };
  } catch (error) {
    return { socialLinks: null, error: error as Error };
  }
}
