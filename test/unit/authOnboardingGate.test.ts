import {
  getRouteAccessDecision,
  getSafeAppReturnTo,
} from '../../src/utils/authOnboardingGate';
import { ROUTES, type OnboardingState } from '../../src/utils/onboardingState';

const basicsRequiredState: OnboardingState = {
  status: 'profile-basics-required',
  userId: 'user-1',
  prefill: {
    display_name: null,
    user_name: null,
    date_of_birth: null,
    gender: null,
  },
  missingFields: ['display_name', 'user_name', 'date_of_birth', 'gender'],
};

const optionalPendingState: OnboardingState = {
  status: 'optional-profile-details',
  userId: 'user-1',
  prefill: {
    display_name: 'Alex',
    user_name: 'alex',
    date_of_birth: '1998-04-12',
    gender: 'other',
  },
  missingFields: [],
};

const recoveryState: OnboardingState = {
  ...optionalPendingState,
  status: 'recovery',
  missingFields: ['display_name'],
  reason: 'backend-read-failed',
};

const onboardedState: OnboardingState = {
  ...optionalPendingState,
  status: 'fully-onboarded',
};

describe('auth onboarding route gate', () => {
  it('keeps first-time signed-out users on Get Started', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: false,
      isAuthenticated: false,
      onboardingState: null,
      pathname: ROUTES.landing,
    });

    expect(decision.targetRoute).toBeNull();
    expect(decision.canAccessLandingRoute).toBe(true);
    expect(decision.canAccessAuthRoutes).toBe(true);
  });

  it('routes returning signed-out users from root to Auth', () => {
    expect(getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: false,
      onboardingState: null,
      pathname: ROUTES.landing,
    }).targetRoute).toBe(ROUTES.auth);
  });

  it('stores a safe app return path for signed-out protected deep links', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: false,
      isAuthenticated: false,
      onboardingState: null,
      pathname: '/profile/test',
    });

    expect(decision.targetRoute).toBe(ROUTES.auth);
    expect(decision.returnTo).toBe('/profile/test');
  });

  it('rejects invalid or non-app return targets', () => {
    expect(getSafeAppReturnTo('/auth')).toBeNull();
    expect(getSafeAppReturnTo('/onboarding/profile/basic')).toBeNull();
    expect(getSafeAppReturnTo('/terms')).toBeNull();
    expect(getSafeAppReturnTo('/')).toBeNull();
    expect(getSafeAppReturnTo('//evil.example')).toBeNull();
    expect(getSafeAppReturnTo('https://evil.example/profile/test')).toBeNull();
    expect(getSafeAppReturnTo('/unknown-route')).toBeNull();
  });

  it('routes profile-basics users to Profile Basics', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: basicsRequiredState,
      pathname: ROUTES.home,
    });

    expect(decision.targetRoute).toBe(ROUTES.onboardingBasic);
    expect(decision.canAccessProfileBasicsRoute).toBe(true);
  });

  it('routes optional-profile users to Complete Profile', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: optionalPendingState,
      pathname: ROUTES.home,
    });

    expect(decision.targetRoute).toBe(ROUTES.onboardingComplete);
    expect(decision.canAccessCompleteProfileRoute).toBe(true);
  });

  it('keeps recovery users on Recovery instead of guessing Profile Basics', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: recoveryState,
      pathname: ROUTES.home,
    });

    expect(decision.targetRoute).toBe(ROUTES.onboardingRecovery);
    expect(decision.canAccessRecoveryRoute).toBe(true);
  });

  it('routes fully onboarded users away from completed auth and onboarding routes', () => {
    expect(getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: onboardedState,
      pathname: ROUTES.auth,
    }).targetRoute).toBe(ROUTES.home);

    expect(getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: onboardedState,
      pathname: ROUTES.onboardingComplete,
    }).targetRoute).toBe(ROUTES.home);
  });

  it('returns fully onboarded users to a stored protected deep link', () => {
    const decision = getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: onboardedState,
      pathname: ROUTES.auth,
      storedReturnTo: '/profile/test',
    });

    expect(decision.targetRoute).toBe('/profile/test');
    expect(decision.canAccessAppRoutes).toBe(true);
  });

  it('leaves public and unknown routes alone', () => {
    expect(getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: false,
      onboardingState: null,
      pathname: '/terms',
    }).targetRoute).toBeNull();

    expect(getRouteAccessDecision({
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: onboardedState,
      pathname: '/missing-page',
    }).targetRoute).toBeNull();
  });
});
