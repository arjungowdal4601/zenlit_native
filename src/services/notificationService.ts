import { supabase } from '../lib/supabase';

export type NotificationPreferences = {
  messages: boolean;
  muted_conversations: string[];
};

export type NotificationSettings = {
  enabled: boolean;
  preferences: NotificationPreferences;
};

export const normalizeNotificationPreferences = (
  preferences?: Partial<NotificationPreferences> | null,
): NotificationPreferences => ({
  messages: preferences?.messages !== false,
  muted_conversations: Array.isArray(preferences?.muted_conversations)
    ? (preferences.muted_conversations as string[])
    : [],
});

const getUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

export const getNotificationSettings = async (): Promise<{
  settings: NotificationSettings | null;
  error: Error | null;
}> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { settings: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .rpc('get_my_private_profile')
      .single();

    if (error) {
      return { settings: null, error };
    }

    return {
      settings: {
        enabled: data?.notification_enabled ?? true,
        preferences: normalizeNotificationPreferences(data?.notification_preferences),
      },
      error: null,
    };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
};

export const savePushToken = async (token: string): Promise<{ error: Error | null }> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: token,
        last_token_update: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

export const removePushToken = async (): Promise<{ error: Error | null }> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: null,
        last_token_update: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

export const updateNotificationSettings = async (
  updates: {
    enabled?: boolean;
    preferences?: Partial<NotificationPreferences>;
  },
): Promise<{ settings: NotificationSettings | null; error: Error | null }> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { settings: null, error: new Error('Not authenticated') };
    }

    const current = await getNotificationSettings();
    const currentPreferences = current.settings?.preferences ?? normalizeNotificationPreferences();
    const nextPreferences = updates.preferences
      ? normalizeNotificationPreferences({ ...currentPreferences, ...updates.preferences })
      : currentPreferences;

    const payload: Record<string, unknown> = {};
    if (updates.enabled !== undefined) payload.notification_enabled = updates.enabled;
    if (updates.preferences) payload.notification_preferences = nextPreferences;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      return { settings: null, error };
    }

    return {
      settings: {
        enabled: updates.enabled ?? current.settings?.enabled ?? true,
        preferences: nextPreferences,
      },
      error: null,
    };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
};
