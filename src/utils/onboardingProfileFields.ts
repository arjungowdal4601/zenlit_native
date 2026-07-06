import type {
  BasicProfileValues,
  OnboardingProfileRecord,
  ProfileBasicsDraftRecord,
  RequiredProfileField,
} from './onboardingState';
import { USERNAME_PATTERN } from './profileValidation';

export const EMPTY_PREFILL: BasicProfileValues = {
  display_name: null,
  user_name: null,
  date_of_birth: null,
  gender: null,
};

const REQUIRED_FIELDS: RequiredProfileField[] = [
  'display_name',
  'user_name',
  'date_of_birth',
  'gender',
];

const VALID_GENDERS = new Set(['male', 'female', 'other']);

const cleanString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isValidDisplayName = (value: string | null) =>
  typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 50;

const isValidUsername = (value: string | null) =>
  typeof value === 'string' &&
  value.length >= 3 &&
  value.length <= 30 &&
  USERNAME_PATTERN.test(value);

const isValidDateOfBirth = (value: string | null) => {
  if (!value) return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return false;

  const minimumAge = new Date(today);
  minimumAge.setFullYear(today.getFullYear() - 13);
  return date <= minimumAge;
};

const isValidGender = (value: string | null) =>
  typeof value === 'string' && VALID_GENDERS.has(value);

const isFieldValid = (field: RequiredProfileField, value: string | null) => {
  switch (field) {
    case 'display_name':
      return isValidDisplayName(value);
    case 'user_name':
      return isValidUsername(value);
    case 'date_of_birth':
      return isValidDateOfBirth(value);
    case 'gender':
      return isValidGender(value);
    default:
      return false;
  }
};

const normalizeBasics = (
  values?: OnboardingProfileRecord | ProfileBasicsDraftRecord | null,
): BasicProfileValues => ({
  display_name: cleanString(values?.display_name),
  user_name: cleanString(values?.user_name)?.toLowerCase() ?? null,
  date_of_birth: cleanString(values?.date_of_birth),
  gender: cleanString(values?.gender)?.toLowerCase() ?? null,
});

export const mergePrefill = (
  profile?: OnboardingProfileRecord | null,
  draft?: ProfileBasicsDraftRecord | null,
): BasicProfileValues => {
  const normalizedProfile = normalizeBasics(profile);
  const normalizedDraft = normalizeBasics(draft);

  return {
    display_name: normalizedProfile.display_name ?? normalizedDraft.display_name,
    user_name: normalizedProfile.user_name ?? normalizedDraft.user_name,
    date_of_birth: normalizedProfile.date_of_birth ?? normalizedDraft.date_of_birth,
    gender: normalizedProfile.gender ?? normalizedDraft.gender,
  };
};

export const getMissingFields = (values: BasicProfileValues): RequiredProfileField[] =>
  REQUIRED_FIELDS.filter((field) => !isFieldValid(field, values[field]));

export const hasInvalidSavedProfileValue = (
  profile: OnboardingProfileRecord | null | undefined,
) => {
  if (!profile) return false;

  const normalized = normalizeBasics(profile);
  return REQUIRED_FIELDS.some((field) => {
    const rawValue = profile[field];
    const hasSavedValue = typeof rawValue === 'string' && rawValue.trim().length > 0;
    return hasSavedValue && !isFieldValid(field, normalized[field]);
  });
};
