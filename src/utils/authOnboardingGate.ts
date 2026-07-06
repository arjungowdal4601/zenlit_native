import {
  canAccessMainApp,
  getRouteForOnboardingState,
  ROUTES,
  type AppRoute,
  type OnboardingState,
} from './onboardingState';

const PUBLIC_ROUTES = new Set(['/terms', '/privacy']);

export type AuthOnboardingGateInput = {
  firstSegment?: string;
  hasSeenGetStarted: boolean;
  isAuthenticated: boolean;
  onboardingState: OnboardingState | null;
  pathname: string;
};

export const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.has(pathname);

export const getAuthOnboardingRedirect = ({
  firstSegment,
  hasSeenGetStarted,
  isAuthenticated,
  onboardingState,
  pathname,
}: AuthOnboardingGateInput): AppRoute | null => {
  if (isPublicRoute(pathname)) return null;

  const inAuthRoute = firstSegment === 'auth';
  const inOnboardingRoute = firstSegment === 'onboarding';
  const onGetStarted = !firstSegment || firstSegment === 'index';

  if (!isAuthenticated) {
    if (onGetStarted && !hasSeenGetStarted) return null;
    if (inAuthRoute) return null;
    return ROUTES.auth;
  }

  if (!onboardingState) return null;

  const targetRoute = getRouteForOnboardingState(onboardingState);
  const hasMainAccess = canAccessMainApp(onboardingState);

  if (!hasMainAccess && pathname !== targetRoute) return targetRoute;
  if (hasMainAccess && (onGetStarted || inAuthRoute || inOnboardingRoute)) return targetRoute;
  return null;
};
