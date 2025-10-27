// Dynamic Expo config to allow environment-driven values
// This file lets us derive iOS URL schemes from .env instead of hardcoding.

export default ({ config }: any) => {
  const redirectScheme = process.env.EXPO_PUBLIC_REDIRECT_SCHEME || config.scheme || "zenlit-native";
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const reversedGoogleScheme = googleIosClientId
    ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
    : undefined;

  // Read any existing schemes from the provided config
  const existingSchemes: string[] =
    config?.ios?.infoPlist?.CFBundleURLTypes?.[0]?.CFBundleURLSchemes || [];

  // Merge env-driven schemes with any existing ones, deduplicated
  const mergedSchemes = Array.from(
    new Set([redirectScheme, ...(reversedGoogleScheme ? [reversedGoogleScheme] : []), ...existingSchemes].filter(Boolean))
  );

  return {
    ...config,
    scheme: redirectScheme,
    ios: {
      ...(config.ios || {}),
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: mergedSchemes,
          },
        ],
      },
    },
  };
};