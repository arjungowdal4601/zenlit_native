export const IOS_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const ANDROID_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
export const WEB_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const GOOGLE_OAUTH_SCOPES = ["openid", "profile", "email"] as const;
export const EXPO_REDIRECT_SCHEME: string =
  process.env.EXPO_PUBLIC_REDIRECT_SCHEME || process.env.EXPO_PUBLIC_EXPO_REDIRECT_SCHEME || "zenlit-native";

// Optional reversed iOS scheme (mostly used by old GoogleSignIn SDKs; not required by AuthSession)
export const IOS_URL_SCHEME: string | undefined = IOS_CLIENT_ID
  ? `com.googleusercontent.apps.${IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')}`
  : undefined;