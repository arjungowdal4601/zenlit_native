import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      supabaseUrl,
      supabaseAnonKey,
      eas: config.extra?.eas,
      router: config.extra?.router,
    },
  } as ExpoConfig;
};
