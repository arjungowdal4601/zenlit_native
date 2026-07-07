import type {
  BasicProfileValues,
  OnboardingProfileRecord,
  ProfileBasicsDraftRecord,
  RequiredProfileField,
} from './onboardingState';
import {
  parseDobString,
  validateDateOfBirth,
  validateDisplayName,
  validateUsername,
  VALID_GENDERS,
} from './profileValidation';

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

const cleanString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isValidDisplayName = (value: string | null) =>
  typeof value === 'string' && validateDisplayName(value.trim()).isValid;

const isValidUsername = (value: string | null) =>
  typeof value === 'string' && validateUsername(value).isValid;

const isValidDateOfBirth = (value: string | null) => {
  if (!value) return false;
  return Boolean(parseDobString(value)) && validateDateOfBirth(value).isValid;
};

const isValidGender = (value: string | null) =>
  typeof value === 'string' && (VALID_GENDERS as readonly string[]).includes(value);

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
