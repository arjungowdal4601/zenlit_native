import '../src/polyfills';
import './global.css';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { MessagingProvider } from '../src/contexts/MessagingContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { AppLoadingScreen } from '../src/components/app-loading-screen';
import { AppToastProvider } from '../src/components/ui/app-toast';
import Navigation from '../src/components/Navigation';
import { theme } from '../src/styles/theme';
import { styles } from '../src/styles/rootLayout.styles';
import { useAuthOnboardingGate } from '../src/hooks/useAuthOnboardingGate';

const ROOT_STACK_SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: theme.prism.colors.background },
};

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
    return <AppLoadingScreen />;
  }

  const routeAccess = shell.routeAccess;

  return (
    <SafeAreaProvider>
      <AppToastProvider>
        <VisibilityProvider enabled={shell.shouldShowNav}>
          <MessagingProvider>
            <ProfileProvider>
              <View style={styles.appShell}>
              <StatusBar style="light" />
              <Stack screenOptions={ROOT_STACK_SCREEN_OPTIONS}>
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
                <Stack.Screen name="index" />
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
              {routeAccess?.targetRoute ? (
                <View style={styles.routeLoadingOverlay}>
                  <AppLoadingScreen />
                </View>
              ) : null}
              </View>
            </ProfileProvider>
          </MessagingProvider>
        </VisibilityProvider>
      </AppToastProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
