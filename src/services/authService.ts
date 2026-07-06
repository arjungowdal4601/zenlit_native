import type { SupabaseConfigStatus } from '../lib/supabase';
import { supabase, supabaseConfigStatus, supabaseReady } from '../lib/supabase';

export type AppUser = {
  id: string;
  email: string | null;
};

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | string;

const AUTH_REQUEST_TIMEOUT_MS = 8000;

type SupabaseAuthResponse = { data: any; error: any };

const withAuthTimeout = async <T>(request: PromiseLike<T>, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), AUTH_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

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

  const { data, error } = await withAuthTimeout<SupabaseAuthResponse>(
    supabase.auth.getUser(),
    'Auth user check',
  );
  if (error || !data.user) return null;
  return toAppUser(data.user);
};

export const getCurrentSessionUser = async (): Promise<AppUser | null> => {
  if (!supabaseReady) return null;

  const { data, error } = await withAuthTimeout<SupabaseAuthResponse>(
    supabase.auth.getSession(),
    'Auth session check',
  );
  if (error || !data.session?.user) return null;
  return toAppUser(data.session.user);
};

export const signInWithEmailOtp = async (email: string) => {
  if (!supabaseReady) {
    return { data: null, error: new Error('Authentication service is not configured') };
  }

  return withAuthTimeout<SupabaseAuthResponse>(supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  }), 'Email OTP request');
};

export const verifyEmailOtp = async (email: string, token: string) => {
  if (!supabaseReady) {
    return { user: null, error: new Error('Authentication service is not configured') };
  }

  const { data, error } = await withAuthTimeout<SupabaseAuthResponse>(supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  }), 'Email OTP verification');

  return {
    user: toAppUser(data?.user),
    error,
  };
};

export const signOut = async (scope: 'local' | 'global' = 'global') => {
  if (!supabaseReady) return { error: null };
  return withAuthTimeout(supabase.auth.signOut({ scope }), 'Sign out');
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
