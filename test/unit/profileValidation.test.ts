import {
  formatDate,
  normalizeGender,
  parseDobString,
  validateDateOfBirth,
  validateDisplayName,
  sanitizeUsernameInput,
  validateUsername,
} from '../../src/utils/profileValidation';

describe('profile validation', () => {
  it('returns friendly inline validation messages for invalid basics', () => {
    expect(validateDisplayName('').error).toBe('Display name is required');
    expect(validateUsername('ab').error).toBe('Username must be at least 3 characters long');
    expect(validateDateOfBirth('not-a-date').error).toBe('Please enter a valid date');
  });

  it('keeps username rules aligned with onboarding copy', () => {
    expect(validateUsername('alex.g_2026').isValid).toBe(true);
    expect(validateUsername('alex-g').isValid).toBe(false);
    expect(sanitizeUsernameInput('Alex-G!')).toBe('alexg');
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
