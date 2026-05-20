import '../src/polyfills';
import '../src/utils/applyWebShadowPatch';

import React, { useCallback, useEffect, useState } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';

import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { MessagingProvider } from '../src/contexts/MessagingContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { theme } from '../src/styles/theme';
import { supabase, supabaseReady } from '../src/lib/supabase';
import Navigation from '../src/components/Navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';
import {
  canAccessMainApp,
  getRouteForOnboardingState,
  ROUTES,
  type OnboardingState,
} from '../src/utils/authNavigation';
import { resolveOnboardingState } from '../src/services/onboardingService';
import { useNotifications } from '../src/hooks/useNotifications';
import { readHasSeenGetStarted, persistHasSeenGetStarted } from '../src/utils/getStartedPreference';

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
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [fontsLoaded] = useFonts({ Inter_500Medium });
  const { notification } = useNotifications();
  const [hasSeenGetStarted, setHasSeenGetStarted] = useState<boolean | null>(null);

  const refreshOnboardingState = useCallback(async (userId?: string | null) => {
    setIsCheckingOnboarding(true);
    const state = await resolveOnboardingState({ userId });
    setOnboardingState(state);
    setIsCheckingOnboarding(false);
    return state;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
      });
    }
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;
    readHasSeenGetStarted()
      .then((seen) => {
        if (isMounted) {
          setHasSeenGetStarted(seen);
        }
      })
      .catch((error) => {
        logger.warn('App', 'Failed to load landing preference', error);
        if (isMounted) {
          setHasSeenGetStarted(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        if (!supabaseReady) {
          logger.warn('App', 'Supabase not ready, skipping session check');
          setIsCheckingAuth(false);
          setIsAuthenticated(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        const hasSession = !!session;

        setIsAuthenticated(hasSession);
        setIsCheckingAuth(false);

        if (hasSession) {
          await refreshOnboardingState(session?.user.id ?? null);
        } else {
          setOnboardingState(null);
        }

        // Reduced logging
      } catch (err) {
        logger.error('Auth', 'Error checking session:', err);
        setIsAuthenticated(false);
        setOnboardingState(null);
        setIsCheckingAuth(false);
        setIsCheckingOnboarding(false);
      }
    };

    checkInitialAuth();
  }, [refreshOnboardingState, supabaseReady]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const hasSession = !!session;

        setIsAuthenticated(hasSession);

        if (event === 'SIGNED_IN' && hasSession) {
          setHasSeenGetStarted(true);
          void persistHasSeenGetStarted();
          const state = await refreshOnboardingState(session.user.id);
          router.replace(getRouteForOnboardingState(state));
        } else if (event === 'SIGNED_OUT') {
          setOnboardingState(null);
          setIsCheckingOnboarding(false);
          router.replace(ROUTES.auth);
        }
      }
    );
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [refreshOnboardingState, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setHasSeenGetStarted(true);
      void persistHasSeenGetStarted();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (notification && notification.request.content.data) {
      const data = notification.request.content.data;
      logger.info('Notification', 'Received notification in foreground:', data);

      if (data.type === 'message' && data.senderId) {
        router.push(`/messages/${data.senderId}`);
      }
    }
  }, [notification, router]);

  useEffect(() => {
    if (
      !fontsLoaded ||
      isCheckingAuth ||
      isCheckingOnboarding ||
      isAuthenticated === null ||
      hasSeenGetStarted === null
    ) {
      return;
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === 'auth' || currentSegment === 'onboarding';
    const onGetStarted = !currentSegment || currentSegment === 'index';
    const skipLanding = hasSeenGetStarted === true;

    if (isAuthenticated) {
      if (!onboardingState) {
        void refreshOnboardingState();
        return;
      }

      const targetRoute = getRouteForOnboardingState(onboardingState);
      const hasMainAccess = canAccessMainApp(onboardingState);
      const onOptionalDetails =
        pathname === ROUTES.onboardingComplete &&
        onboardingState.status === 'optional-profile-details';

      if (!hasMainAccess && pathname !== targetRoute) {
        router.replace(targetRoute);
        return;
      }

      if (hasMainAccess && (onGetStarted || (inAuthGroup && !onOptionalDetails))) {
        router.replace(targetRoute);
      }
    } else {
      if (skipLanding && onGetStarted) {
        router.replace(ROUTES.auth);
      } else if (skipLanding && !inAuthGroup && !onGetStarted) {
        router.replace(ROUTES.auth);
      } else if (!skipLanding && !inAuthGroup && !onGetStarted) {
        router.replace(ROUTES.landing);
      }
    }
  }, [
    fontsLoaded,
    hasSeenGetStarted,
    isAuthenticated,
    isCheckingAuth,
    isCheckingOnboarding,
    onboardingState,
    pathname,
    refreshOnboardingState,
    router,
    segments,
  ]);

  if (
    !fontsLoaded ||
    isCheckingAuth ||
    isCheckingOnboarding ||
    isAuthenticated === null ||
    hasSeenGetStarted === null ||
    (isAuthenticated && !onboardingState)
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Checking setup…</Text>
      </View>
    );
  }

  const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
  const onGetStarted = !segments[0] || segments[0] === 'index';
  const shouldShowNav =
    isAuthenticated &&
    canAccessMainApp(onboardingState) &&
    !inAuthGroup &&
    !onGetStarted;

  return (
    <SafeAreaProvider>
      <VisibilityProvider>
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
                {/** Ensure Get Started (index) is fully immersive: no header */}
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
              {shouldShowNav ? <Navigation /> : null}
            </View>
          </ProfileProvider>
        </MessagingProvider>
      </VisibilityProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
  },
});

export default RootLayout;
