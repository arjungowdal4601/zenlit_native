import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import { theme } from '../src/styles/theme';
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
import { persistHasSeenGetStarted, readHasSeenGetStarted } from '../src/utils/getStartedPreference';

const PUBLIC_ROUTES = new Set(['/terms', '/privacy']);

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
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
      });
    }
  }, [pathname]);
};

const useNotificationRouting = (router: ReturnType<typeof useRouter>) => {
  const { notification } = useNotifications();

  useEffect(() => {
    if (!notification?.request.content.data) return;
    const data = notification.request.content.data;
    logger.info('Notification', 'Received notification in foreground:', data);
    if (data.type === 'message' && data.senderId) {
      router.push(`/messages/${data.senderId}`);
    }
  }, [notification, router]);
};

export const useRootLayoutController = () => {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
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

  useWebShellEffects(pathname);
  useNotificationRouting(router);

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
    const checkInitialAuth = async () => {
      try {
        if (!isAuthReady()) {
          logger.warn('App', 'Supabase not ready, skipping session check');
          setIsCheckingAuth(false);
          setIsAuthenticated(false);
          return;
        }

        const sessionUser = await getCurrentSessionUser();
        if (!sessionUser) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          setOnboardingState(null);
          return;
        }

        const user = await getCurrentUser();
        if (!user) {
          logger.warn('Auth', 'Stored session user is no longer valid');
          await clearStaleAuthSession();
          return;
        }

        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        await refreshOnboardingState(user.id);
      } catch (error) {
        logger.error('Auth', 'Error checking session:', error);
        setIsAuthenticated(false);
        setOnboardingState(null);
        setIsCheckingAuth(false);
        setIsCheckingOnboarding(false);
      }
    };

    void checkInitialAuth();
  }, [clearStaleAuthSession, refreshOnboardingState]);

  useEffect(() => {
    if (!isAuthReady()) return;
    return onAuthChange(async (event, user) => {
      const hasSession = !!user;
      setIsAuthenticated(hasSession);

      if (event === 'SIGNED_IN' && hasSession) {
        setHasSeenGetStarted(true);
        void persistHasSeenGetStarted();
        const state = await refreshOnboardingState(user.id);
        if (state.status !== 'guest') router.replace(getRouteForOnboardingState(state));
      } else if (event === 'SIGNED_OUT') {
        setOnboardingState(null);
        setIsCheckingOnboarding(false);
        router.replace(ROUTES.auth);
      }
    });
  }, [refreshOnboardingState, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setHasSeenGetStarted(true);
      void persistHasSeenGetStarted();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isCheckingAuth || isCheckingOnboarding || isAuthenticated === null || hasSeenGetStarted === null) {
      return;
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === 'auth' || currentSegment === 'onboarding';
    const onGetStarted = !currentSegment || currentSegment === 'index';
    const skipLanding = hasSeenGetStarted === true;
    if (isPublicRoute) return;

    if (!isAuthenticated) {
      if (skipLanding && onGetStarted) router.replace(ROUTES.auth);
      else if (skipLanding && !inAuthGroup && !onGetStarted) router.replace(ROUTES.auth);
      else if (!skipLanding && !inAuthGroup && !onGetStarted) router.replace(ROUTES.landing);
      return;
    }

    if (!onboardingState) {
      void refreshOnboardingState();
      return;
    }

    const targetRoute = getRouteForOnboardingState(onboardingState);
    const hasMainAccess = canAccessMainApp(onboardingState);
    const onOptionalDetails =
      pathname === ROUTES.onboardingComplete && onboardingState.status === 'optional-profile-details';

    if (shouldRefreshBeforeOnboardingRedirect(onboardingState, pathname)) {
      void refreshOnboardingState(onboardingState.userId).then((refreshedState) => {
        if (refreshedState.status === 'optional-profile-details' && pathname === ROUTES.onboardingComplete) {
          return;
        }

        const refreshedRoute = getRouteForOnboardingState(refreshedState);
        if (pathname !== refreshedRoute) router.replace(refreshedRoute);
      });
      return;
    }

    if (!hasMainAccess && pathname !== targetRoute) router.replace(targetRoute);
    if (hasMainAccess && (onGetStarted || (inAuthGroup && !onOptionalDetails))) {
      router.replace(targetRoute);
    }
  }, [
    hasSeenGetStarted, isAuthenticated, isCheckingAuth, isCheckingOnboarding, onboardingState,
    pathname, isPublicRoute, refreshOnboardingState, router, segments,
  ]);

  const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
  const onGetStarted = !segments[0] || segments[0] === 'index';
  return {
    authConfigStatus,
    authReady: isAuthReady(),
    isLoading: isCheckingAuth || isCheckingOnboarding || isAuthenticated === null ||
      hasSeenGetStarted === null || (isAuthenticated && !onboardingState),
    pathname,
    shouldShowNav: isAuthenticated === true && canAccessMainApp(onboardingState) && !inAuthGroup && !onGetStarted,
  };
};
