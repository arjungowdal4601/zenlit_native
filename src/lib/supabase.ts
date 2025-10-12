import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safely read environment values across web/native and guard against invalid strings
const readEnv = (key: string): string | undefined => {
  const val = (process.env as any)?.[key] ?? (globalThis as any)?.[key];
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') return undefined;
  return trimmed;
};

const envUrl = readEnv('EXPO_PUBLIC_SUPABASE_URL');
const envAnon = readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const isValidHttpUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const isLikelySupabaseUrl = (url?: string): boolean => {
  if (!isValidHttpUrl(url)) return false;
  try {
    const u = new URL(url as string);
    const host = u.host.toLowerCase();
    const port = u.port;
    const path = u.pathname.toLowerCase();

    // Official hosted projects
    if (host.includes('supabase.co') || host.includes('supabase.com') || host.includes('supabase.in')) {
      return true;
    }

    // Local dev: typically `http://127.0.0.1:54321` or endpoints prefixed with service paths
    const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocalHost) {
      // Accept common local Supabase REST port or explicit service paths
      if (port === '54321') return true;
      if (path.startsWith('/rest') || path.startsWith('/auth') || path.startsWith('/storage') || path.startsWith('/functions')) {
        return true;
      }
      return false;
    }

    return false;
  } catch {
    return false;
  }
};

const hasValidConfig = isLikelySupabaseUrl(envUrl) && !!envAnon;

// Instrumentation to help diagnose environment issues in preview
(() => {
  const meta = {
    envUrl,
    envAnonPresent: !!envAnon,
    parsedUrlOk: isValidHttpUrl(envUrl),
    looksLikeSupabaseUrl: isLikelySupabaseUrl(envUrl),
    ready: hasValidConfig,
  };
  // Use console.info to avoid red error logs but provide visibility
  console.info('[Supabase Init]', meta);
})();

// Create client with defensive try/catch; fall back to safe stub if creation fails
let supabase: any;
let supabaseReady = false;

const makeStub = () => {
  console.warn('[Supabase] Not configured or failed to initialize. Running in preview-safe mode without backend.');
  const unsupported = (method?: string) => {
    const err = new Error(`[Supabase] Not configured. ${method ? method + ' is unavailable in preview-safe mode.' : 'Backend unavailable.'}`);
    return Promise.reject(err);
  };
  return {
    auth: {
      getUser: () => unsupported('auth.getUser'),
      getSession: async () => ({ data: { session: null }, error: new Error('Not configured') } as any),
      signInWithOtp: () => unsupported('auth.signInWithOtp'),
      signOut: () => unsupported('auth.signOut'),
      onAuthStateChange: () => ({ data: { subscription: null } }),
    },
    from: () => ({
      select: () => unsupported('from.select'),
      upsert: () => unsupported('from.upsert'),
      eq: () => ({ select: () => unsupported('from.eq.select'), single: () => unsupported('from.eq.single') }),
    }),
    storage: {
      from: () => ({
        upload: () => unsupported('storage.upload'),
        getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
      }),
    },
  } as any;
};

if (hasValidConfig) {
  try {
    supabase = createClient(envUrl as string, envAnon as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    supabaseReady = true;
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
    supabase = makeStub();
    supabaseReady = false;
  }
} else {
  supabase = makeStub();
  supabaseReady = false;
}

export { supabase, supabaseReady };

// Handle auth state changes only when real client exists
if (supabaseReady) {
  supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      // Clear any stored session data
      await AsyncStorage.removeItem('supabase.auth.token');
      console.log('User signed out, session cleared');
    }
  });
}

// Function to clear invalid session data
export const clearInvalidSession = async () => {
  try {
    await AsyncStorage.removeItem('supabase.auth.token');
    if (supabaseReady) {
      await supabase.auth.signOut();
    }
    console.log('Invalid session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};