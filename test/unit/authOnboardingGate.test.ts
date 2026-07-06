import { getAuthOnboardingRedirect } from '../../src/utils/authOnboardingGate';
import { ROUTES, type OnboardingState } from '../../src/utils/onboardingState';

const optionalPendingState: OnboardingState = {
  status: 'optional-profile-details',
  userId: 'user-1',
  canAccessMainApp: false,
  prefill: {
    display_name: 'Alex',
    user_name: 'alex',
    date_of_birth: '1998-04-12',
    gender: 'other',
  },
  missingFields: [],
};

const onboardedState: OnboardingState = {
  ...optionalPendingState,
  status: 'fully-onboarded',
  canAccessMainApp: true,
};

describe('auth onboarding route gate', () => {
  it('sends unauthenticated direct onboarding links to Auth', () => {
    expect(getAuthOnboardingRedirect({
      firstSegment: 'onboarding',
      hasSeenGetStarted: false,
      isAuthenticated: false,
      onboardingState: null,
      pathname: ROUTES.onboardingBasic,
    })).toBe(ROUTES.auth);
  });

  it('keeps first-time guests on the landing screen', () => {
    expect(getAuthOnboardingRedirect({
      firstSegment: undefined,
      hasSeenGetStarted: false,
      isAuthenticated: false,
      onboardingState: null,
      pathname: ROUTES.landing,
    })).toBeNull();
  });

  it('routes authenticated basics-complete users to Complete Profile', () => {
    expect(getAuthOnboardingRedirect({
      firstSegment: 'radar',
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: optionalPendingState,
      pathname: ROUTES.home,
    })).toBe(ROUTES.onboardingComplete);
  });

  it('routes onboarded users away from auth/onboarding to Radar', () => {
    expect(getAuthOnboardingRedirect({
      firstSegment: 'auth',
      hasSeenGetStarted: true,
      isAuthenticated: true,
      onboardingState: onboardedState,
      pathname: ROUTES.auth,
    })).toBe(ROUTES.home);
  });
});
