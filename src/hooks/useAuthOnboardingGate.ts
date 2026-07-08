import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { theme } from '../styles/theme';
import { toError } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import { evaluateOnboardingState, type OnboardingState } from '../utils/onboardingState';
import { getRouteAccessDecision, getSafeAppReturnTo } from '../utils/authOnboardingGate';
import { resolveOnboardingState, subscribeToOnboardingState } from '../services/onboardingService';
import {
  getAuthConfigStatus,
  getCurrentUser,
  isAuthReady,
  onAuthChange,
  signOut,
} from '../services/authService';
import { persistHasSeenGetStarted, readHasSeenGetStarted } from '../utils/getStartedPreference';

const RETURN_TO_STORAGE_KEY = 'zenlit.returnTo';

const readStoredReturnTo = () => {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return null;
  try {
    return getSafeAppReturnTo(sessionStorage.getItem(RETURN_TO_STORAGE_KEY));
  } catch {
    return null;
  }
};

const writeStoredReturnTo = (returnTo: string | null) => {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  try {
    if (returnTo) sessionStorage.setItem(RETURN_TO_STORAGE_KEY, returnTo);
    else sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {}
};

const useWebShellEffects = (pathname: string) => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const styleId = 'zenlit-web-typography';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
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

export const useAuthOnboardingGate = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [hasSeenGetStarted, setHasSeenGetStarted] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [storedReturnTo, setStoredReturnTo] = useState(readStoredReturnTo);
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
        profileError: toError(error, 'Failed to check onboarding state'),
      });
      setOnboardingState(state);
      setIsCheckingOnboarding(false);
      return state;
    }
  }, [clearStaleAuthSession, finishSignedOut]);

  useWebShellEffects(pathname);

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

        const user = await getCurrentUser();
        if (!active) return;
        if (!user) {
          logger.warn('Auth', 'No active auth user found');
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
        return;
      }

      if (event === 'SIGNED_IN') {
        setCurrentUserId(user.id);
        setIsAuthenticated(true);
        setHasSeenGetStarted(true);
        void persistHasSeenGetStarted();
        await refreshOnboardingState(user.id);
      }
    });
  }, [finishSignedOut, refreshOnboardingState]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setHasSeenGetStarted(true);
    void persistHasSeenGetStarted();
  }, [isAuthenticated]);

  useEffect(() => subscribeToOnboardingState((state) => {
    if (state.status === 'guest') {
      finishSignedOut();
      return;
    }
    setIsAuthenticated(true);
    setOnboardingState(state);
    setCurrentUserId(state.userId);
  }), [finishSignedOut]);

  const routeAccess = useMemo(() => {
    if (isAuthenticated === null || hasSeenGetStarted === null) return null;
    return getRouteAccessDecision({
      hasSeenGetStarted,
      isAuthenticated,
      onboardingState,
      pathname,
      storedReturnTo,
    });
  }, [hasSeenGetStarted, isAuthenticated, onboardingState, pathname, storedReturnTo]);

  useEffect(() => {
    if (isCheckingAuth || isCheckingOnboarding || isAuthenticated === null || hasSeenGetStarted === null) {
      return;
    }

    if (isAuthenticated && !onboardingState) {
      void refreshOnboardingState(currentUserId);
      return;
    }

    if (!routeAccess) return;

    if (routeAccess.returnTo && routeAccess.returnTo !== storedReturnTo) {
      setStoredReturnTo(routeAccess.returnTo);
      writeStoredReturnTo(routeAccess.returnTo);
    }

    if (routeAccess.targetRoute && pathname !== routeAccess.targetRoute) {
      router.replace(routeAccess.targetRoute);
    }
  }, [
    currentUserId, hasSeenGetStarted, isAuthenticated, isCheckingAuth, isCheckingOnboarding,
    onboardingState, pathname, refreshOnboardingState, routeAccess, router, storedReturnTo,
  ]);

  useEffect(() => {
    if (!storedReturnTo || onboardingState?.status !== 'fully-onboarded') return;
    if (pathname === storedReturnTo || !getSafeAppReturnTo(storedReturnTo)) {
      setStoredReturnTo(null);
      writeStoredReturnTo(null);
    }
  }, [onboardingState?.status, pathname, storedReturnTo]);

  return {
    authConfigStatus,
    authReady: isAuthReady(),
    isLoading: isCheckingAuth || isCheckingOnboarding || isAuthenticated === null ||
      hasSeenGetStarted === null || (isAuthenticated && !onboardingState),
    pathname,
    routeAccess,
    shouldShowNav: routeAccess?.shouldShowNav ?? false,
  };
};
