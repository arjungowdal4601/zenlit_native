import { resolveOnboardingRoute } from '../services/onboardingService';
import {
  canAccessMainApp,
  getRouteForOnboardingState,
  ROUTES,
  type OnboardingState,
} from './onboardingState';

export { ROUTES, canAccessMainApp, getRouteForOnboardingState };
export type { OnboardingState };

export const determinePostAuthRoute = async (options?: {
  userId?: string | null;
  preferOptionalDetails?: boolean;
}) => resolveOnboardingRoute(options);

export const getPostLogoutRoute = () => ROUTES.auth;
