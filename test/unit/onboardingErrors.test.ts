import {
  getFriendlyOnboardingError,
  isDuplicateProfileEmailError,
  isDuplicateUsernameError,
} from '../../src/utils/onboardingErrors';

describe('onboarding error messages', () => {
  it('separates duplicate username from duplicate profile email', () => {
    const usernameError = new Error(
      'duplicate key value violates unique constraint "profiles_user_name_key"',
    );
    const emailError = new Error(
      'duplicate key value violates unique constraint "profiles_email_key"',
    );

    expect(isDuplicateUsernameError(usernameError)).toBe(true);
    expect(isDuplicateProfileEmailError(usernameError)).toBe(false);
    expect(getFriendlyOnboardingError(usernameError)).toBe(
      'That username is already taken. Please choose another.',
    );

    expect(isDuplicateUsernameError(emailError)).toBe(false);
    expect(isDuplicateProfileEmailError(emailError)).toBe(true);
    expect(getFriendlyOnboardingError(emailError)).toBe(
      'This email is still linked to another profile. Please sign out and try again.',
    );
  });
});
