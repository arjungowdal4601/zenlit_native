import {
  ROUTES,
  canAccessMainApp,
  evaluateOnboardingState,
  getRouteForOnboardingState,
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

const profileWithOptionalComplete = {
  ...completeProfile,
  optional_profile_completed_at: '2026-07-05T12:00:00.000Z',
};

describe('onboarding state evaluation', () => {
  it('routes guests to the auth flow', () => {
    const state = evaluateOnboardingState({
      userId: null,
      profile: null,
      draft: null,
    });

    expect(state.status).toBe('guest');
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.auth);
    expect(canAccessMainApp(state)).toBe(false);
  });

  it('sends authenticated users with no profile to Profile Basics', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
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

  it('keeps users on Complete Profile until optional details are saved or skipped', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: completeProfile,
      draft: null,
    });

    expect(state.status).toBe('optional-profile-details');
    expect(canAccessMainApp(state)).toBe(false);
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.onboardingComplete);
  });

  it('allows Radar after Complete Profile is saved or skipped', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: profileWithOptionalComplete,
      draft: null,
    });

    expect(state.status).toBe('fully-onboarded');
    expect(canAccessMainApp(state)).toBe(true);
    expect(getRouteForOnboardingState(state)).toBe(ROUTES.home);
  });

  it('routes ambiguous backend failures to recovery instead of Radar', () => {
    const state = evaluateOnboardingState({
      userId: USER_ID,
      profile: null,
      draft: null,
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
      draftError: new Error('relation "profile_basics_drafts" does not exist'),
    });

    expect(state.status).toBe('recovery');
    expect(state.reason).toBe('draft-read-failed');
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
