import {
  ROUTES,
  canAccessMainApp,
  createCheckingOnboardingState,
  evaluateOnboardingState,
  getRouteForOnboardingState,
  shouldRefreshBeforeOnboardingRedirect,
} from '../../src/utils/onboardingState';
import { evaluateUsernameAvailability } from '../../src/utils/usernameAvailability';

const USER_ID = 'user-123';

const completeProfile = {
  id: USER_ID,
  display_name: 'Alex Johnson',
  user_name: 'alex',
  date_of_birth: '1998-04-12',
  gender: 'other',
  email: 'alex@example.com',
};

describe('onboarding state evaluation', () => {
  it('routes guests to the auth flow', () => {
    const state = evaluateOnboardingState({
      userId: null,
      profile: null,
      draft: null,
      socialLinks: null,
    });

    expect(state.status).toBe('guest');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.auth);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('keeps authenticated users out of the main app while setup is being checked', () => {
    const state = createCheckingOnboardingState(USER_ID);

    expect(state.status).toBe('checking');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.auth);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('sends authenticated users with no profile to Profile Basics', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
      socialLinks: null,
    });

    expect(state.status).toBe('profile-basics-required');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingBasic);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('keeps saved draft basics available for prefill while requiring Profile Basics', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: {
        id: USER_ID,
        display_name: 'Alex Johnson',
        user_name: 'alex',
        date_of_birth: null,
        gender: null,
      },
      socialLinks: null,
    });

    expect(state.status).toBe('profile-basics-required');
    expect(state.prefill).toEqual({
      display_name: 'Alex Johnson',
      user_name: 'alex',
      date_of_birth: null,
      gender: null,
    });
    expect(state.missingFields).toEqual(['date_of_birth', 'gender']);
  });

  it('allows Radar when required profile basics are complete even without optional details', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: completeProfile,
      draft: null,
      socialLinks: null,
    });

    expect(state.status).toBe('optional-profile-details');
    expect(canAccessMainApp(state)).toBe(true);
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.home);
    expect(getRouteForOnboardingState(state, { preferOptionalDetails: true })).toBe(
      ROUTES.onboardingComplete,
    );
  });

  it('refreshes before redirecting away from optional details during stale basics handoff', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
      socialLinks: null,
    });

    expect(shouldRefreshBeforeOnboardingRedirect(state, ROUTES.onboardingComplete)).toBe(true);
    expect(shouldRefreshBeforeOnboardingRedirect(state, ROUTES.onboardingBasic)).toBe(false);
    expect(shouldRefreshBeforeOnboardingRedirect(state, ROUTES.home)).toBe(false);
  });

  it('does not refresh before redirect for users already in optional details state', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: completeProfile,
      draft: null,
      socialLinks: null,
    });

    expect(shouldRefreshBeforeOnboardingRedirect(state, ROUTES.onboardingComplete)).toBe(false);
  });

  it('routes ambiguous backend failures to recovery instead of Radar', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
      socialLinks: null,
      profileError: new Error('network failed'),
    });

    expect(state.status).toBe('recovery');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingRecovery);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('routes draft read failures to recovery instead of silently dropping saved setup', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
      socialLinks: null,
      draftError: new Error('relation "profile_basics_drafts" does not exist'),
    });

    expect(state.status).toBe('recovery');
    expect(state.reason).toBe('draft-read-failed');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingRecovery);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('routes optional profile read failures to recovery instead of treating optional details as missing', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: completeProfile,
      draft: null,
      socialLinks: null,
      socialLinksError: new Error('permission denied for table social_links'),
    });

    expect(state.status).toBe('recovery');
    expect(state.reason).toBe('optional-profile-read-failed');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingRecovery);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('routes corrupt saved required profile data to recovery', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: {
        ...completeProfile,
        date_of_birth: 'not-a-date',
      },
      draft: null,
      socialLinks: null,
    });

    expect(state.status).toBe('recovery');
    expect(state.reason).toBe('invalid-profile-data');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingRecovery);
  });
});

describe('username availability ownership', () => {
  it('allows the current user to keep their own saved username', () => {
    const result = evaluateUsernameAvailability({
      currentUserId: USER_ID,
      ownerId: USER_ID,
      requestedUsername: 'alex',
      suggestions: ['alex1'],
    });

    expect(result.isAvailable).toBe(true);
    expect(result.suggestions).toEqual([]);
  });

  it('blocks usernames owned by another user and keeps suggestions', () => {
    const result = evaluateUsernameAvailability({
      currentUserId: USER_ID,
      ownerId: 'other-user',
      requestedUsername: 'alex',
      suggestions: ['alex42', 'alex_2026'],
    });

    expect(result.isAvailable).toBe(false);
    expect(result.suggestions).toEqual(['alex42', 'alex_2026']);
  });
});
