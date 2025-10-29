import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const IOS_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const ANDROID_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
export const WEB_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const GOOGLE_OAUTH_SCOPES = ["openid", "profile", "email"] as const;
export const EXPO_REDIRECT_SCHEME: string =
  process.env.EXPO_PUBLIC_REDIRECT_SCHEME || process.env.EXPO_PUBLIC_EXPO_REDIRECT_SCHEME || "zenlit";

// Optional reversed iOS scheme (mostly used by old GoogleSignIn SDKs; not required by AuthSession)
export const IOS_URL_SCHEME: string | undefined = IOS_CLIENT_ID
  ? `com.googleusercontent.apps.${IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')}`
  : undefined;

// Helper to detect if running in development build
export const isDevelopmentBuild = (): boolean => {
  return Constants.appOwnership === 'expo' || __DEV__;
};

// Helper to get debug info about OAuth configuration
export const getOAuthDebugInfo = () => {
  return {
    platform: Platform.OS,
    iosClientId: IOS_CLIENT_ID ? 'configured' : 'missing',
    androidClientId: ANDROID_CLIENT_ID ? 'configured' : 'missing',
    webClientId: WEB_CLIENT_ID ? 'configured' : 'missing',
    redirectScheme: EXPO_REDIRECT_SCHEME,
    iosUrlScheme: IOS_URL_SCHEME ? 'configured' : 'missing',
    isDevelopment: isDevelopmentBuild(),
  };
};

// Validate OAuth configuration
export const validateOAuthConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!WEB_CLIENT_ID) {
    errors.push('Web Client ID is missing. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
  }

  if (Platform.OS === 'ios' && !IOS_CLIENT_ID) {
    errors.push('iOS Client ID is missing. Check EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env');
  }

  if (Platform.OS === 'android' && !ANDROID_CLIENT_ID) {
    errors.push('Android Client ID is missing. Check EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env');
  }

  if (!EXPO_REDIRECT_SCHEME) {
    errors.push('Redirect scheme is missing. Check EXPO_PUBLIC_REDIRECT_SCHEME in .env');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};