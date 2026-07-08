import type {
  BasicProfileValues,
  OnboardingProfileRecord,
  ProfileBasicsDraftRecord,
  RequiredProfileField,
} from './onboardingState';
import {
  formatDate,
  normalizeGender,
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

export const REQUIRED_PROFILE_FIELDS: RequiredProfileField[] = [
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

export const isBasicProfileFieldValid = (field: RequiredProfileField, value: string | null) => {
  switch (field) {
    case 'display_name':
      return typeof value === 'string' && validateDisplayName(value.trim()).isValid;
    case 'user_name':
      return typeof value === 'string' && validateUsername(value).isValid;
    case 'date_of_birth':
      return Boolean(value && parseDobString(value)) && validateDateOfBirth(value ?? '').isValid;
    case 'gender':
      return typeof value === 'string' && (VALID_GENDERS as readonly string[]).includes(value);
    default:
      return false;
  }
};

const normalizeStoredProfileBasics = (
  values?: OnboardingProfileRecord | ProfileBasicsDraftRecord | null,
): BasicProfileValues => ({
  display_name: cleanString(values?.display_name),
  user_name: cleanString(values?.user_name)?.toLowerCase() ?? null,
  date_of_birth: cleanString(values?.date_of_birth),
  gender: cleanString(values?.gender)?.toLowerCase() ?? null,
});

export const normalizeProfileBasicsInput = (
  values: Partial<BasicProfileValues>,
): BasicProfileValues => {
  const dateOfBirth = cleanString(values.date_of_birth);
  const parsedDob = dateOfBirth ? parseDobString(dateOfBirth) : null;
  const gender = cleanString(values.gender);

  return {
    display_name: cleanString(values.display_name),
    user_name: cleanString(values.user_name)?.toLowerCase() ?? null,
    date_of_birth: parsedDob ? formatDate(parsedDob) : dateOfBirth,
    gender: gender ? normalizeGender(gender) : null,
  };
};

export const getValidProfileBasicsDraftValues = (
  values: Partial<BasicProfileValues>,
): BasicProfileValues => {
  const normalized = normalizeProfileBasicsInput(values);
  return {
    display_name: isBasicProfileFieldValid('display_name', normalized.display_name) ? normalized.display_name : null,
    user_name: isBasicProfileFieldValid('user_name', normalized.user_name) ? normalized.user_name : null,
    date_of_birth: isBasicProfileFieldValid('date_of_birth', normalized.date_of_birth) ? normalized.date_of_birth : null,
    gender: isBasicProfileFieldValid('gender', normalized.gender) ? normalized.gender : null,
  };
};

export const mergePrefill = (
  profile?: OnboardingProfileRecord | null,
  draft?: ProfileBasicsDraftRecord | null,
): BasicProfileValues => {
  const normalizedProfile = normalizeStoredProfileBasics(profile);
  const normalizedDraft = normalizeStoredProfileBasics(draft);

  return {
    display_name: normalizedProfile.display_name ?? normalizedDraft.display_name,
    user_name: normalizedProfile.user_name ?? normalizedDraft.user_name,
    date_of_birth: normalizedProfile.date_of_birth ?? normalizedDraft.date_of_birth,
    gender: normalizedProfile.gender ?? normalizedDraft.gender,
  };
};

export const getMissingFields = (values: BasicProfileValues): RequiredProfileField[] =>
  REQUIRED_PROFILE_FIELDS.filter((field) => !isBasicProfileFieldValid(field, values[field]));

export const hasInvalidSavedProfileValue = (
  profile: OnboardingProfileRecord | null | undefined,
) => {
  if (!profile) return false;

  const normalized = normalizeStoredProfileBasics(profile);
  return REQUIRED_PROFILE_FIELDS.some((field) => {
    const rawValue = profile[field];
    const hasSavedValue = typeof rawValue === 'string' && rawValue.trim().length > 0;
    return hasSavedValue && !isBasicProfileFieldValid(field, normalized[field]);
  });
};
