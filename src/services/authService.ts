import type { SupabaseConfigStatus } from '../lib/supabase';
import { supabase, supabaseConfigStatus, supabaseReady } from '../lib/supabase';

export type AppUser = {
  id: string;
  email: string | null;
};

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | string;

const toAppUser = (user: { id: string; email?: string | null } | null | undefined): AppUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
  };
};

export const isAuthReady = () => supabaseReady;

export const getAuthConfigStatus = (): SupabaseConfigStatus => supabaseConfigStatus;

export const getCurrentUser = async (): Promise<AppUser | null> => {
  if (!supabaseReady) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return toAppUser(data.user);
};

export const getCurrentSessionUser = async (): Promise<AppUser | null> => {
  if (!supabaseReady) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return toAppUser(data.session.user);
};

export const signInWithEmailOtp = async (email: string) => {
  if (!supabaseReady) {
    return { data: null, error: new Error('Authentication service is not configured') };
  }

  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
};

export const verifyEmailOtp = async (email: string, token: string) => {
  if (!supabaseReady) {
    return { user: null, error: new Error('Authentication service is not configured') };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  return {
    user: toAppUser(data?.user),
    error,
  };
};

export const signOut = async (scope: 'local' | 'global' = 'global') => {
  if (!supabaseReady) return { error: null };
  return supabase.auth.signOut({ scope });
};

export const onAuthChange = (
  callback: (event: AuthChangeEvent, user: AppUser | null) => void | Promise<void>,
) => {
  if (!supabaseReady || !supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: any) => {
    await callback(event, toAppUser(session?.user));
  });

  return () => {
    data?.subscription?.unsubscribe?.();
  };
};
