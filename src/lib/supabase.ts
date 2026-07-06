import { logger } from '../utils/logger'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const normalize = (val?: string): string | undefined => {
  if (typeof val !== 'string') return undefined
  const trimmed = val.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
  if (!trimmed) return undefined
  const lower = trimmed.toLowerCase()
  if (lower === 'undefined' || lower === 'null') return undefined
  return trimmed
}

export type SupabaseConfig = { url?: string; anonKey?: string; source: string }

export type SupabaseConfigStatus = {
  ready: boolean
  error: string | null
  source: string
}

const getSupabaseConfig = (): SupabaseConfig => {
  let url = normalize(process.env.EXPO_PUBLIC_SUPABASE_URL)
  let anonKey = normalize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  let source = 'process.env'

  if (!url || !anonKey) {
    url = normalize(Constants.expoConfig?.extra?.supabaseUrl)
    anonKey = normalize(Constants.expoConfig?.extra?.supabaseAnonKey)
    source = 'Constants.expoConfig.extra'
  }

  if (!url || !anonKey) {
    url = normalize((Constants as any).manifest?.extra?.supabaseUrl)
    anonKey = normalize((Constants as any).manifest?.extra?.supabaseAnonKey)
    source = 'Constants.manifest.extra'
  }

  return { url, anonKey, source };
};

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
  if (!isValidHttpUrl(url)) return false
  try {
    const u = new URL(url as string)
    const host = u.host.toLowerCase()
    if (host.includes('supabase.co') || host.includes('supabase.com') || host.includes('supabase.in')) return true
    if (host.includes('localhost') || host.includes('127.0.0.1')) return true
    return false
  } catch {
    return false
  }
}

export const validateSupabaseConfig = ({
  url,
  anonKey,
  source,
}: SupabaseConfig): SupabaseConfigStatus => {
  if (!url && !anonKey) {
    return {
      ready: false,
      error: 'Supabase URL and anon key are required.',
      source,
    }
  }

  if (!url) {
    return {
      ready: false,
      error: 'Supabase URL is required.',
      source,
    }
  }

  if (!anonKey) {
    return {
      ready: false,
      error: 'Supabase anon key is required.',
      source,
    }
  }

  if (!isLikelySupabaseUrl(url)) {
    return {
      ready: false,
      error: 'Supabase URL must point to a Supabase project or local Supabase instance.',
      source,
    }
  }

  return {
    ready: true,
    error: null,
    source,
  }
}

const { url: envUrl, anonKey: envAnon, source: configSource } = getSupabaseConfig()

export let supabaseConfigStatus = validateSupabaseConfig({
  url: envUrl,
  anonKey: envAnon,
  source: configSource,
})

const cryptoAvailable = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
const urlAvailable = typeof URL !== 'undefined';

(() => {
  const meta = {
    configSource,
    url: envUrl ? `${envUrl.substring(0, 30)}...` : 'missing',
    anonKeyPrefix: envAnon ? `${envAnon.substring(0, 20)}...` : 'missing',
    parsedUrlOk: isValidHttpUrl(envUrl),
    looksLikeSupabaseUrl: isLikelySupabaseUrl(envUrl),
    cryptoAvailable,
    urlAvailable,
    ready: supabaseConfigStatus.ready,
    error: supabaseConfigStatus.error,
  }
  logger.info('Supabase', 'Initialization config', meta)
})()

// Create the real client only when configuration is valid. Missing config is a
// hard app state, not a fake unauthenticated backend.
let supabase: any
let supabaseReady = false

if (supabaseConfigStatus.ready) {
  try {
    supabase = createClient(envUrl as string, envAnon as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
    supabaseReady = true
  } catch (err) {
    logger.error('Supabase', 'Failed to initialize client:', err)
    supabase = null
    supabaseReady = false
    supabaseConfigStatus = {
      ready: false,
      error: 'Supabase client failed to initialize.',
      source: configSource,
    }
  }
} else {
  logger.error('Supabase', 'Supabase configuration is invalid', supabaseConfigStatus)
  supabase = null
  supabaseReady = false
}

export { supabase, supabaseReady, getSupabaseConfig }
