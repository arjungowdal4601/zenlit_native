import { supabase } from '../lib/supabase';
import type { Profile, PublicProfile, SocialLinks } from '../lib/types';
import { evaluateUsernameAvailability } from '../utils/usernameAvailability';
import type { UsernameCheckResult } from '../utils/profileValidation';

export async function getCurrentUserProfile(): Promise<{ profile: Profile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { profile: null, socialLinks: null, error: new Error('Not authenticated') };
    }

    const { data: profile, error: profileError } = await supabase
      .rpc('get_my_private_profile')
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

export async function getProfileById(userId: string): Promise<{ profile: PublicProfile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, user_name, account_created_at')
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
      profile: profile as PublicProfile | null,
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

/**
 * Checks if username is available and provides suggestions if not.
 */
export const checkUsernameAvailability = async (
  username: string,
  currentUserId?: string | null,
): Promise<UsernameCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_name')
      .eq('user_name', username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const suggestions = data ? await generateUsernameSuggestions(username) : [];
    return evaluateUsernameAvailability({
      requestedUsername: username,
      currentUserId,
      ownerId: data?.id ?? null,
      suggestions,
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw new Error('Failed to check username availability');
  }
};

/**
 * Generates username suggestions when the desired username is taken.
 */
export const generateUsernameSuggestions = async (baseUsername: string): Promise<string[]> => {
  const candidates: string[] = [];
  const maxSuggestions = 5;
  const maxAttempts = 15;

  const suggestionTypes = [
    () => `${baseUsername}${Math.floor(Math.random() * 999) + 1}`,
    () => `${baseUsername}_${Math.floor(Math.random() * 99) + 1}`,
    () => `${baseUsername}.${Math.floor(Math.random() * 99) + 1}`,
    () => `${baseUsername}${new Date().getFullYear()}`,
    () => `${baseUsername}_user`,
    () => `${baseUsername}${Math.floor(Math.random() * 9999) + 100}`,
  ];

  for (let i = 0; i < maxAttempts; i++) {
    const suggestion = suggestionTypes[i % suggestionTypes.length]();

    if (!candidates.includes(suggestion)) {
      candidates.push(suggestion);
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_name')
      .in('user_name', candidates);

    if (error) {
      return [];
    }

    const taken = new Set((data ?? []).map(({ user_name }: { user_name: string }) => user_name));
    return candidates
      .filter((suggestion) => !taken.has(suggestion))
      .slice(0, maxSuggestions);
  } catch (error) {
    return [];
  }
};
