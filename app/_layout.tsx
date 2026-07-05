import '../src/polyfills';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { MessagingProvider } from '../src/contexts/MessagingContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import Navigation from '../src/components/Navigation';
import { theme } from '../src/styles/theme';
import { styles } from './rootLayout.styles';
import { useRootLayoutController } from './useRootLayoutController';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const RootLayout: React.FC = () => {
  const shell = useRootLayoutController();

  if (!shell.authReady) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Backend configuration error</Text>
        <Text style={styles.errorText}>
          {shell.authConfigStatus.error ?? 'Supabase is not configured.'}
        </Text>
        <Text style={styles.errorMeta}>Source: {shell.authConfigStatus.source}</Text>
      </View>
    );
  }

  if (shell.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Checking setup...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <VisibilityProvider enabled={shell.shouldShowNav}>
        <MessagingProvider>
          <ProfileProvider>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <StatusBar style="light" backgroundColor={theme.colors.background} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
              {shell.shouldShowNav ? <Navigation /> : null}
              {Platform.OS === 'web' ? (
                <>
                  <Analytics framework="react" route={shell.pathname} path={shell.pathname} />
                  <SpeedInsights framework="react" route={shell.pathname} />
                </>
              ) : null}
            </View>
          </ProfileProvider>
        </MessagingProvider>
      </VisibilityProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
