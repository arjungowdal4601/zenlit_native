import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import { theme } from '../styles/theme';
import { logger } from '../utils/logger';
import { canAccessMainApp, evaluateOnboardingState, getRouteForOnboardingState, ROUTES, type OnboardingState } from '../utils/onboardingState';
import { getAuthOnboardingRedirect, isPublicRoute } from '../utils/authOnboardingGate';
import { resolveOnboardingState, subscribeToOnboardingState } from '../services/onboardingService';
import {
  getAuthConfigStatus,
  getCurrentSessionUser,
  getCurrentUser,
  isAuthReady,
  onAuthChange,
  signOut,
} from '../services/authService';
import { useNotifications } from './useNotifications';
import { persistHasSeenGetStarted, readHasSeenGetStarted } from '../utils/getStartedPreference';

const asError = (error: unknown, fallback: string) =>
  error instanceof Error ? error : new Error(fallback);

const useWebShellEffects = (pathname: string) => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const styleId = 'zenlit-web-typography';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html, body, #root, #expo-root {
          font-family: ${theme.typography.fontFamily.web};
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        button, input, textarea, select { font-family: inherit; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      activeElement?.blur();
    });
  }, [pathname]);
};

const useNotificationRouting = (
  router: ReturnType<typeof useRouter>,
  enabled: boolean,
) => {
  const { notification } = useNotifications();

  useEffect(() => {
    if (!enabled || !notification?.request.content.data) return;
    const data = notification.request.content.data;
    logger.info('Notification', 'Received notification in foreground:', data);
    if (data.type === 'message' && data.senderId) {
      router.push(`/messages/${data.senderId}`);
    }
  }, [enabled, notification, router]);
};

export const useAuthOnboardingGate = () => {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [hasSeenGetStarted, setHasSeenGetStarted] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const authConfigStatus = getAuthConfigStatus();

  const finishSignedOut = useCallback(() => {
    setCurrentUserId(null);
    setIsAuthenticated(false);
    setOnboardingState(null);
    setIsCheckingAuth(false);
    setIsCheckingOnboarding(false);
  }, []);

  const clearStaleAuthSession = useCallback(async () => {
    try {
      await signOut('local');
    } catch (error) {
      logger.warn('Auth', 'Failed to clear stale local session', error);
    }
    finishSignedOut();
  }, [finishSignedOut]);

  const refreshOnboardingState = useCallback(async (userId: string | null) => {
    if (!userId) {
      finishSignedOut();
      return evaluateOnboardingState({ userId: null });
    }

    setIsCheckingOnboarding(true);
    try {
      const state = await resolveOnboardingState({ userId });
      if (state.status === 'guest') {
        await clearStaleAuthSession();
        return state;
      }
      setCurrentUserId(state.userId);
      setOnboardingState(state);
      setIsCheckingOnboarding(false);
      return state;
    } catch (error) {
      logger.error('Onboarding', 'Gate failed to refresh onboarding state', error);
      const state = evaluateOnboardingState({
        userId,
        profileError: asError(error, 'Failed to check onboarding state'),
      });
      setOnboardingState(state);
      setIsCheckingOnboarding(false);
      return state;
    }
  }, [clearStaleAuthSession, finishSignedOut]);

  useWebShellEffects(pathname);
  useNotificationRouting(router, canAccessMainApp(onboardingState));

  useEffect(() => {
    let isMounted = true;
    readHasSeenGetStarted()
      .then((seen) => isMounted && setHasSeenGetStarted(seen))
      .catch((error) => {
        logger.warn('App', 'Failed to load landing preference', error);
        if (isMounted) setHasSeenGetStarted(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const checkInitialAuth = async () => {
      try {
        if (!isAuthReady()) {
          logger.warn('App', 'Supabase not ready, skipping session check');
          finishSignedOut();
          return;
        }

        const sessionUser = await getCurrentSessionUser();
        if (!active) return;
        if (!sessionUser) {
          finishSignedOut();
          return;
        }

        const user = await getCurrentUser();
        if (!active) return;
        if (!user) {
          logger.warn('Auth', 'Stored session user is no longer valid');
          await clearStaleAuthSession();
          return;
        }

        setCurrentUserId(user.id);
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        await refreshOnboardingState(user.id);
      } catch (error) {
        logger.error('Auth', 'Error checking session:', error);
        finishSignedOut();
      }
    };

    void checkInitialAuth();
    return () => {
      active = false;
    };
  }, [clearStaleAuthSession, finishSignedOut, refreshOnboardingState]);

  useEffect(() => {
    if (!isAuthReady()) return;
    return onAuthChange(async (event, user) => {
      if (event === 'SIGNED_OUT' || !user) {
        finishSignedOut();
        router.replace(ROUTES.auth);
        return;
      }

      if (event === 'SIGNED_IN') {
        setCurrentUserId(user.id);
        setIsAuthenticated(true);
        setHasSeenGetStarted(true);
        void persistHasSeenGetStarted();
        const state = await refreshOnboardingState(user.id);
        if (state.status !== 'guest') router.replace(getRouteForOnboardingState(state));
      }
    });
  }, [finishSignedOut, refreshOnboardingState, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setHasSeenGetStarted(true);
    void persistHasSeenGetStarted();
  }, [isAuthenticated]);

  useEffect(() => subscribeToOnboardingState((state) => {
    setOnboardingState(state);
    setCurrentUserId(state.userId);
  }), []);

  useEffect(() => {
    if (isCheckingAuth || isCheckingOnboarding || isAuthenticated === null || hasSeenGetStarted === null) {
      return;
    }

    if (isAuthenticated && !onboardingState) {
      void refreshOnboardingState(currentUserId);
      return;
    }

    const redirect = getAuthOnboardingRedirect({
      firstSegment,
      hasSeenGetStarted,
      isAuthenticated,
      onboardingState,
      pathname,
    });

    if (redirect && pathname !== redirect) router.replace(redirect);
  }, [
    currentUserId, firstSegment, hasSeenGetStarted, isAuthenticated, isCheckingAuth,
    isCheckingOnboarding, onboardingState, pathname, refreshOnboardingState, router,
  ]);

  const inAuthRoute = firstSegment === 'auth';
  const inOnboardingRoute = firstSegment === 'onboarding';
  const onGetStarted = !firstSegment || firstSegment === 'index';

  return {
    authConfigStatus,
    authReady: isAuthReady(),
    isLoading: isCheckingAuth || isCheckingOnboarding || isAuthenticated === null ||
      hasSeenGetStarted === null || (isAuthenticated && !onboardingState),
    pathname,
    shouldShowNav: isAuthenticated === true && canAccessMainApp(onboardingState) &&
      !inAuthRoute && !inOnboardingRoute && !onGetStarted && !isPublicRoute(pathname),
  };
};
