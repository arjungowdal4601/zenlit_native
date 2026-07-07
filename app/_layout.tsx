import '../src/polyfills';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { MessagingProvider } from '../src/contexts/MessagingContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import Navigation from '../src/components/Navigation';
import { theme } from '../src/styles/theme';
import { styles } from '../src/styles/rootLayout.styles';
import { useAuthOnboardingGate } from '../src/hooks/useAuthOnboardingGate';

const RootLayout: React.FC = () => {
  const shell = useAuthOnboardingGate();

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

  const routeAccess = shell.routeAccess;

  return (
    <SafeAreaProvider>
      <VisibilityProvider enabled={shell.shouldShowNav}>
        <MessagingProvider>
          <ProfileProvider>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                <Stack.Protected guard={routeAccess?.canAccessAppRoutes === true}>
                  <Stack.Screen name="radar" />
                  <Stack.Screen name="feed" />
                  <Stack.Screen name="create" />
                  <Stack.Screen name="messages" />
                  <Stack.Screen name="profile" />
                  <Stack.Screen name="edit-profile" />
                  <Stack.Screen name="feedback" />
                  <Stack.Screen name="notification-settings" />
                </Stack.Protected>
                <Stack.Protected guard={routeAccess?.canAccessAuthRoutes === true}>
                  <Stack.Screen name="auth" />
                </Stack.Protected>
                <Stack.Protected guard={routeAccess?.canAccessLandingRoute === true}>
                  <Stack.Screen name="index" />
                </Stack.Protected>
                <Stack.Protected guard={routeAccess?.canAccessProfileBasicsRoute === true}>
                  <Stack.Screen name="onboarding/profile/basic" />
                </Stack.Protected>
                <Stack.Protected guard={routeAccess?.canAccessCompleteProfileRoute === true}>
                  <Stack.Screen name="onboarding/profile/complete" />
                </Stack.Protected>
                <Stack.Protected guard={routeAccess?.canAccessRecoveryRoute === true}>
                  <Stack.Screen name="onboarding/recovery" />
                </Stack.Protected>
                <Stack.Screen name="terms" />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="+not-found" />
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
