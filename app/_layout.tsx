import '../src/polyfills';

import React, { useCallback, useEffect, useState } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { MessagingProvider } from '../src/contexts/MessagingContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { theme } from '../src/styles/theme';
import Navigation from '../src/components/Navigation';
import { logger } from '../src/utils/logger';
import {
  canAccessMainApp,
  getRouteForOnboardingState,
  ROUTES,
  shouldRefreshBeforeOnboardingRedirect,
  type OnboardingState,
} from '../src/utils/onboardingState';
import { resolveOnboardingState } from '../src/services/onboardingService';
import {
  getAuthConfigStatus,
  getCurrentSessionUser,
  getCurrentUser,
  isAuthReady,
  onAuthChange,
  signOut,
} from '../src/services/authService';
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
  const { notification } = useNotifications();
  const [hasSeenGetStarted, setHasSeenGetStarted] = useState<boolean | null>(null);
  const authConfigStatus = getAuthConfigStatus();

  const clearStaleAuthSession = useCallback(async () => {
    try {
      await signOut('local');
    } catch (error) {
      logger.warn('Auth', 'Failed to clear stale local session', error);
    }

    setIsAuthenticated(false);
    setOnboardingState(null);
    setIsCheckingAuth(false);
    setIsCheckingOnboarding(false);
  }, []);

  const refreshOnboardingState = useCallback(async (userId?: string | null) => {
    setIsCheckingOnboarding(true);
    const state = await resolveOnboardingState({ userId });

    if (state.status === 'guest') {
      await clearStaleAuthSession();
      return state;
    }

    setOnboardingState(state);
    setIsCheckingOnboarding(false);
    return state;
  }, [clearStaleAuthSession]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const styleId = 'zenlit-web-typography';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html,
      body,
      #root,
      #expo-root {
        font-family: ${theme.typography.fontFamily.web};
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      button,
      input,
      textarea,
      select {
        font-family: inherit;
      }
    `;
    document.head.appendChild(style);
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
        if (!isAuthReady()) {
          logger.warn('App', 'Supabase not ready, skipping session check');
          setIsCheckingAuth(false);
          setIsAuthenticated(false);
          return;
        }

        const sessionUser = await getCurrentSessionUser();
        const hasSession = !!sessionUser;

        if (hasSession) {
          const user = await getCurrentUser();
          if (!user) {
            logger.warn('Auth', 'Stored session user is no longer valid');
            await clearStaleAuthSession();
            return;
          }

          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          await refreshOnboardingState(user.id);
        } else {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
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
  }, [clearStaleAuthSession, refreshOnboardingState]);

  useEffect(() => {
    if (!isAuthReady()) {
      return;
    }

    const unsubscribe = onAuthChange(
      async (event, user) => {
        const hasSession = !!user;

        setIsAuthenticated(hasSession);

        if (event === 'SIGNED_IN' && hasSession) {
          setHasSeenGetStarted(true);
          void persistHasSeenGetStarted();
          const state = await refreshOnboardingState(user.id);
          if (state.status === 'guest') {
            return;
          }
          router.replace(getRouteForOnboardingState(state));
        } else if (event === 'SIGNED_OUT') {
          setOnboardingState(null);
          setIsCheckingOnboarding(false);
          router.replace(ROUTES.auth);
        }
      }
    );
    return unsubscribe;
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

      if (shouldRefreshBeforeOnboardingRedirect(onboardingState, pathname)) {
        void refreshOnboardingState(onboardingState.userId).then((refreshedState) => {
          if (
            refreshedState.status === 'optional-profile-details' &&
            pathname === ROUTES.onboardingComplete
          ) {
            return;
          }

          const refreshedRoute = getRouteForOnboardingState(refreshedState);
          if (pathname !== refreshedRoute) {
            router.replace(refreshedRoute);
          }
        });
        return;
      }

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

  if (!isAuthReady()) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Backend configuration error</Text>
        <Text style={styles.errorText}>
          {authConfigStatus.error ?? 'Supabase is not configured.'}
        </Text>
        <Text style={styles.errorMeta}>Source: {authConfigStatus.source}</Text>
      </View>
    );
  }

  if (
    isCheckingAuth ||
    isCheckingOnboarding ||
    isAuthenticated === null ||
    hasSeenGetStarted === null ||
    (isAuthenticated && !onboardingState)
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Checking setup...</Text>
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
      <VisibilityProvider enabled={shouldShowNav}>
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
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    color: '#fca5a5',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorMeta: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default RootLayout;
