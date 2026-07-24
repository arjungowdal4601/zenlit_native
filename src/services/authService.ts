import type { SupabaseConfigStatus } from '../lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigStatus, supabaseReady } from '../lib/supabase';
import { withTimeout } from '../utils/async';
import { cleanupPendingUploadsBeforeLogout } from './pendingUploadLedger';

export type AppUser = {
  id: string;
  email: string | null;
};

type SupabaseAuthResponse = { data: any; error: any };

const EMAIL_OTP_TIMEOUT_MS = 20_000;

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

  const { data, error } = await withTimeout<SupabaseAuthResponse>(
    supabase.auth.getUser(),
    'Auth user check',
  );
  if (error || !data.user) return null;
  return toAppUser(data.user);
};

export const signInWithEmailOtp = async (email: string) => {
  if (!supabaseReady) {
    return { data: null, error: new Error('Authentication service is not configured') };
  }

  return withTimeout<SupabaseAuthResponse>(supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  }), 'Email OTP request', EMAIL_OTP_TIMEOUT_MS);
};

export const verifyEmailOtp = async (email: string, token: string) => {
  if (!supabaseReady) {
    return { user: null, error: new Error('Authentication service is not configured') };
  }

  const { data, error } = await withTimeout<SupabaseAuthResponse>(supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  }), 'Email OTP verification', EMAIL_OTP_TIMEOUT_MS);

  return {
    user: toAppUser(data?.user),
    error,
  };
};

export const signOut = async (scope: 'local' | 'global' = 'global') => {
  if (!supabaseReady) return { error: null };

  const user = await getCurrentUser();
  if (user) {
    try {
      const cleanup = cleanupPendingUploadsBeforeLogout(user.id);
      await withTimeout(cleanup, 'Pending image cleanup before sign out', 5000);
    } catch (error) {
      console.warn('Pending image cleanup did not finish before sign out:', error);
    }
  }

  return withTimeout(supabase.auth.signOut({ scope }), 'Sign out');
};

export const onAuthChange = (
  callback: (event: AuthChangeEvent, user: AppUser | null) => void | Promise<void>,
) => {
  if (!supabaseReady || !supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
    await callback(event, toAppUser(session?.user));
  });

  return () => {
    data?.subscription?.unsubscribe?.();
  };
};
