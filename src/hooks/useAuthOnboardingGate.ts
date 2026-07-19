import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { toError } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import { evaluateOnboardingState, type OnboardingState } from '../utils/onboardingState';
import { subscribeToOnboardingState } from '../utils/onboardingStateSync';
import { getRouteAccessDecision, getSafeAppReturnTo } from '../utils/authOnboardingGate';
import { resolveOnboardingState } from '../services/onboardingService';
import {
  getAuthConfigStatus,
  isAuthReady,
  onAuthChange,
  signOut,
} from '../services/authService';

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
  const [storedReturnTo, setStoredReturnTo] = useState(readStoredReturnTo);
  const routeRefreshKeyRef = useRef<string | null>(null);
  const authConfigStatus = getAuthConfigStatus();

  const finishSignedOut = useCallback(() => {
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

  useEffect(() => subscribeToOnboardingState((state) => {
    routeRefreshKeyRef.current = null;
    if (state.status === 'guest') {
      finishSignedOut();
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
    setOnboardingState(state);
    setIsCheckingOnboarding(false);
  }), [finishSignedOut]);

  const refreshOnboardingState = useCallback(async (userId?: string | null) => {
    setIsCheckingOnboarding(true);
    try {
      const state = await resolveOnboardingState(userId ? { userId } : undefined);
      if (state.status === 'guest') {
        await clearStaleAuthSession();
        return state;
      }
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
    let active = true;

    const checkInitialAuth = async () => {
      try {
        if (!isAuthReady()) {
          logger.warn('App', 'Supabase not ready, skipping session check');
          finishSignedOut();
          return;
        }

        setIsCheckingOnboarding(true);
        const state = await resolveOnboardingState();
        if (!active) return;
        if (state.status === 'guest') {
          logger.warn('Auth', 'No active auth user found');
          await clearStaleAuthSession();
          return;
        }

        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        setOnboardingState(state);
        setIsCheckingOnboarding(false);
      } catch (error) {
        logger.error('Auth', 'Error checking session:', error);
        finishSignedOut();
      }
    };

    void checkInitialAuth();
    return () => {
      active = false;
    };
  }, [clearStaleAuthSession, finishSignedOut]);

  useEffect(() => {
    if (!isAuthReady()) return;
    return onAuthChange(async (event, user) => {
      if (event === 'SIGNED_OUT' || !user) {
        finishSignedOut();
        return;
      }

      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        await refreshOnboardingState(user.id);
      }
    });
  }, [finishSignedOut, refreshOnboardingState]);

  const routeAccess = useMemo(() => {
    if (isAuthenticated === null) return null;
    return getRouteAccessDecision({
      isAuthenticated,
      onboardingState,
      pathname,
      storedReturnTo,
    });
  }, [isAuthenticated, onboardingState, pathname, storedReturnTo]);

  const onboardingUserId = onboardingState?.userId ?? null;

  useEffect(() => {
    if (isCheckingAuth || isCheckingOnboarding || isAuthenticated === null) {
      return;
    }

    if (isAuthenticated && !onboardingState) {
      void refreshOnboardingState();
      return;
    }

    if (!routeAccess) return;

    if (routeAccess.returnTo && routeAccess.returnTo !== storedReturnTo) {
      setStoredReturnTo(routeAccess.returnTo);
      writeStoredReturnTo(routeAccess.returnTo);
    }

    if (routeAccess.targetRoute && pathname !== routeAccess.targetRoute) {
      const routeRefreshKey = `${onboardingUserId ?? ''}:${pathname}:${onboardingState?.status ?? 'none'}:${routeAccess.targetRoute}`;
      if (isAuthenticated && onboardingUserId && routeRefreshKeyRef.current !== routeRefreshKey) {
        routeRefreshKeyRef.current = routeRefreshKey;
        void refreshOnboardingState(onboardingUserId);
        return;
      }
      router.replace(routeAccess.targetRoute);
    } else {
      routeRefreshKeyRef.current = null;
    }
  }, [
    isAuthenticated, isCheckingAuth, isCheckingOnboarding, onboardingUserId,
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
      (isAuthenticated && !onboardingState),
    pathname,
    routeAccess,
    shouldShowNav: routeAccess?.shouldShowNav ?? false,
  };
};
