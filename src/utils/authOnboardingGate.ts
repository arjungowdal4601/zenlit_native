import {
  canAccessMainApp,
  getRouteForOnboardingState,
  ROUTES,
  type OnboardingState,
} from './onboardingState';

const PUBLIC_ROUTES = new Set(['/terms', '/privacy']);
const AUTH_ROUTE_PREFIX = '/auth';
const ONBOARDING_ROUTE_PREFIX = '/onboarding';
const APP_EXACT_ROUTES = new Set([
  ROUTES.home,
  '/feed',
  '/create',
  '/messages',
  '/profile',
  '/edit-profile',
  '/feedback',
  '/notification-settings',
]);

const APP_DYNAMIC_ROUTE_PATTERNS = [
  /^\/messages\/[^/?#]+$/,
  /^\/profile\/[^/?#]+$/,
];

export type RouteAccessPhase =
  | 'signed-out-first-run'
  | 'signed-out-returning'
  | 'profile-basics-required'
  | 'optional-profile-details'
  | 'recovery'
  | 'fully-onboarded';

export type RouteAccessDecision = {
  phase: RouteAccessPhase;
  targetRoute: string | null;
  returnTo: string | null;
  shouldShowNav: boolean;
  canAccessAppRoutes: boolean;
  canAccessAuthRoutes: boolean;
  canAccessLandingRoute: boolean;
  canAccessProfileBasicsRoute: boolean;
  canAccessCompleteProfileRoute: boolean;
  canAccessRecoveryRoute: boolean;
};

export type AuthOnboardingGateInput = {
  hasSeenGetStarted: boolean;
  isAuthenticated: boolean;
  onboardingState: OnboardingState | null;
  pathname: string;
  storedReturnTo?: string | null;
};

export const normalizeRoutePath = (value?: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || value.includes('\\') || value.includes('..')) return null;

  const [path] = value.split(/[?#]/);
  if (!path) return null;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

export const isPublicRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path ? PUBLIC_ROUTES.has(path) : false;
};

export const isAuthRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path === AUTH_ROUTE_PREFIX || Boolean(path?.startsWith(`${AUTH_ROUTE_PREFIX}/`));
};

export const isOnboardingRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path === ONBOARDING_ROUTE_PREFIX || Boolean(path?.startsWith(`${ONBOARDING_ROUTE_PREFIX}/`));
};

export const isLandingRoute = (pathname: string) => normalizeRoutePath(pathname) === ROUTES.landing;

export const isAppRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  if (!path) return false;
  return APP_EXACT_ROUTES.has(path) || APP_DYNAMIC_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
};

export const getSafeAppReturnTo = (pathname?: string | null) => {
  const path = normalizeRoutePath(pathname);
  if (!path || !isAppRoute(path)) return null;
  if (isAuthRoute(path) || isOnboardingRoute(path) || isPublicRoute(path) || isLandingRoute(path)) return null;
  return path;
};

export const getRouteAccessDecision = ({
  hasSeenGetStarted,
  isAuthenticated,
  onboardingState,
  pathname,
  storedReturnTo = null,
}: AuthOnboardingGateInput): RouteAccessDecision => {
  const path = normalizeRoutePath(pathname) ?? pathname;
  const safeStoredReturnTo = getSafeAppReturnTo(storedReturnTo);
  const effectiveSignedOut = !isAuthenticated || onboardingState?.status === 'guest';
  const canUseMainApp = isAuthenticated && canAccessMainApp(onboardingState);
  const canAccessProfileBasicsRoute = isAuthenticated && onboardingState?.status === 'profile-basics-required';
  const canAccessCompleteProfileRoute = isAuthenticated && onboardingState?.status === 'optional-profile-details';
  const canAccessRecoveryRoute = isAuthenticated && onboardingState?.status === 'recovery';

  const baseDecision = {
    returnTo: null,
    shouldShowNav: canUseMainApp && isAppRoute(path),
    canAccessAppRoutes: canUseMainApp,
    canAccessAuthRoutes: effectiveSignedOut,
    canAccessLandingRoute: effectiveSignedOut && !hasSeenGetStarted,
    canAccessProfileBasicsRoute,
    canAccessCompleteProfileRoute,
    canAccessRecoveryRoute,
  };

  if (isPublicRoute(path)) {
    if (canUseMainApp) {
      return { ...baseDecision, phase: 'fully-onboarded', targetRoute: null };
    }
    if (canAccessProfileBasicsRoute) {
      return { ...baseDecision, phase: 'profile-basics-required', targetRoute: null };
    }
    if (canAccessCompleteProfileRoute) {
      return { ...baseDecision, phase: 'optional-profile-details', targetRoute: null };
    }
    if (canAccessRecoveryRoute) {
      return { ...baseDecision, phase: 'recovery', targetRoute: null };
    }
    return {
      ...baseDecision,
      phase: hasSeenGetStarted ? 'signed-out-returning' : 'signed-out-first-run',
      targetRoute: null,
    };
  }

  if (effectiveSignedOut) {
    const firstRunOnLanding = isLandingRoute(path) && !hasSeenGetStarted;
    const alreadyInAuth = isAuthRoute(path);

    return {
      ...baseDecision,
      phase: hasSeenGetStarted ? 'signed-out-returning' : 'signed-out-first-run',
      targetRoute: firstRunOnLanding || alreadyInAuth ? null : ROUTES.auth,
      returnTo: getSafeAppReturnTo(path),
    };
  }

  if (!onboardingState) {
    return {
      ...baseDecision,
      phase: hasSeenGetStarted ? 'signed-out-returning' : 'signed-out-first-run',
      targetRoute: null,
    };
  }

  if (canUseMainApp) {
    const targetRoute = safeStoredReturnTo && path !== safeStoredReturnTo
      ? safeStoredReturnTo
      : null;
    const shouldLeaveCompletedFlowRoute = isLandingRoute(path) || isAuthRoute(path) || isOnboardingRoute(path);

    return {
      ...baseDecision,
      phase: 'fully-onboarded',
      targetRoute: targetRoute ?? (shouldLeaveCompletedFlowRoute ? ROUTES.home : null),
    };
  }

  const targetRoute = getRouteForOnboardingState(onboardingState);
  const phase: RouteAccessPhase = onboardingState.status === 'recovery'
    ? 'recovery'
    : onboardingState.status === 'optional-profile-details'
      ? 'optional-profile-details'
      : 'profile-basics-required';

  return {
    ...baseDecision,
    phase,
    targetRoute: path === targetRoute ? null : targetRoute,
  };
};
