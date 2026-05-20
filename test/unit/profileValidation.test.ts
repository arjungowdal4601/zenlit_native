import {
  formatDate,
  normalizeGender,
  parseDobString,
  validateDateOfBirth,
  validateDisplayName,
  validateProfileData,
  validateUsername,
} from '../../src/utils/profileValidation';

describe('profile validation', () => {
  it('accepts the required profile basics used for onboarding', () => {
    const result = validateProfileData({
      display_name: 'Alex Johnson',
      user_name: 'alex.j',
      date_of_birth: '1998-04-12',
      gender: 'other',
    });

    expect(result.isValid).toBe(true);
  });

  it('returns friendly inline validation messages for invalid basics', () => {
    expect(validateDisplayName('').error).toBe('Display name is required');
    expect(validateUsername('ab').error).toBe('Username must be at least 3 characters long');
    expect(validateDateOfBirth('not-a-date').error).toBe('Please enter a valid date');
  });

  it('normalizes gender labels and date strings consistently', () => {
    expect(normalizeGender('Others')).toBe('other');
    expect(normalizeGender('Female')).toBe('female');

    const parsed = parseDobString('2000-01-05');
    expect(parsed).not.toBeNull();
    expect(parsed ? formatDate(parsed) : null).toBe('2000-01-05');
    expect(parseDobString('2000-99-05')).toBeNull();
  });
});
