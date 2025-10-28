// Dynamic Expo config to allow environment-driven values
// This file lets us derive iOS URL schemes from .env instead of hardcoding.

import { ConfigContext, ExpoConfig } from "expo/config";

const uniqueSchemes = (schemes: Array<string | undefined>): string[] =>
  Array.from(new Set((schemes.filter(Boolean) as string[])));

export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  // Ensure redirectScheme is a string, even if config.scheme is an array
  const configSchemeString = Array.isArray(config.scheme)
    ? config.scheme[0]
    : config.scheme;
  const redirectScheme: string =
    process.env.EXPO_PUBLIC_REDIRECT_SCHEME || configSchemeString || "zenlit-native";

  const reversedGoogleScheme = googleIosClientId
    ? `com.googleusercontent.apps.${googleIosClientId.replace(".apps.googleusercontent.com", "")}`
    : undefined;

  const existingInfoPlistSchemes: string[] =
    Array.isArray(config?.ios?.infoPlist?.CFBundleURLTypes) &&
    config.ios?.infoPlist?.CFBundleURLTypes?.[0]?.CFBundleURLSchemes
      ? (config.ios!.infoPlist!.CFBundleURLTypes![0]!.CFBundleURLSchemes as string[])
      : [];

  const configSchemesArray: string[] = Array.isArray(config.scheme)
    ? (config.scheme as string[])
    : (config.scheme ? [config.scheme as string] : []);

  const mergedSchemes = uniqueSchemes([
    redirectScheme,
    reversedGoogleScheme,
    ...configSchemesArray,
    ...existingInfoPlistSchemes,
  ]);

  const result: ExpoConfig = {
    ...config,
    // Ensure required top-level fields are present for typing
    name: config.name ?? "zenlit_native",
    slug: config.slug ?? "zenlit_native",
    owner: "arjungowdal4601",
    scheme: redirectScheme,
    ios: {
      ...(config.ios ?? {}),
      bundleIdentifier: "com.arjungowdal4601.zenlit_native",
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: mergedSchemes,
          },
        ],
      },
    },
    android: {
      ...(config.android ?? {}),
      package: "com.arjungowdal4601.zenlit_native",
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    extra: {
      ...(config.extra ?? {}),
      supabaseUrl,
      supabaseAnonKey,
      googleWebClientId,
      googleAndroidClientId,
      googleIosClientId,
      eas: config.extra?.eas,
      router: config.extra?.router,
    },
  };

  return result;
};