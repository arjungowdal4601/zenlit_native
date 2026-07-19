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

export type RouteAccessDecision = {
  targetRoute: string | null;
  returnTo: string | null;
  shouldShowNav: boolean;
  canAccessAppRoutes: boolean;
  canAccessAuthRoutes: boolean;
  canAccessProfileBasicsRoute: boolean;
  canAccessCompleteProfileRoute: boolean;
  canAccessRecoveryRoute: boolean;
};

export type AuthOnboardingGateInput = {
  isAuthenticated: boolean;
  onboardingState: OnboardingState | null;
  pathname: string;
  storedReturnTo?: string | null;
};

const normalizeRoutePath = (value?: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || value.includes('\\') || value.includes('..')) return null;

  const [path] = value.split(/[?#]/);
  if (!path) return null;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

const isPublicRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path ? PUBLIC_ROUTES.has(path) : false;
};

const isAuthRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path === AUTH_ROUTE_PREFIX || Boolean(path?.startsWith(`${AUTH_ROUTE_PREFIX}/`));
};

const isOnboardingRoute = (pathname: string) => {
  const path = normalizeRoutePath(pathname);
  return path === ONBOARDING_ROUTE_PREFIX || Boolean(path?.startsWith(`${ONBOARDING_ROUTE_PREFIX}/`));
};

const isLandingRoute = (pathname: string) => normalizeRoutePath(pathname) === ROUTES.landing;

const isAppRoute = (pathname: string) => {
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
    canAccessProfileBasicsRoute,
    canAccessCompleteProfileRoute,
    canAccessRecoveryRoute,
  };

  if (isPublicRoute(path)) {
    return { ...baseDecision, targetRoute: null };
  }

  if (effectiveSignedOut) {
    const alreadyInAuth = isAuthRoute(path);

    return {
      ...baseDecision,
      targetRoute: alreadyInAuth ? null : ROUTES.auth,
      returnTo: getSafeAppReturnTo(path),
    };
  }

  if (!onboardingState) {
    return {
      ...baseDecision,
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
      targetRoute: targetRoute ?? (shouldLeaveCompletedFlowRoute ? ROUTES.home : null),
    };
  }

  const targetRoute = getRouteForOnboardingState(onboardingState);

  return {
    ...baseDecision,
    targetRoute: path === targetRoute ? null : targetRoute,
  };
};
