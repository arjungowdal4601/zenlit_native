import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle auth state changes and clear invalid sessions
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any stored session data
    await AsyncStorage.removeItem('supabase.auth.token');
    console.log('User signed out, session cleared');
  }
});

// Function to clear invalid session data
export const clearInvalidSession = async () => {
  try {
    await AsyncStorage.removeItem('supabase.auth.token');
    await supabase.auth.signOut();
    console.log('Invalid session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};