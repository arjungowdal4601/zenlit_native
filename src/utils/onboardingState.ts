export const ROUTES = {
  landing: '/',
  auth: '/auth',
  onboardingBasic: '/onboarding/profile/basic',
  onboardingComplete: '/onboarding/profile/complete',
  onboardingRecovery: '/onboarding/recovery',
  home: '/radar',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

export type RequiredProfileField =
  | 'display_name'
  | 'user_name'
  | 'date_of_birth'
  | 'gender';

export type BasicProfileValues = {
  display_name: string | null;
  user_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
};

export type OnboardingProfileRecord = Partial<BasicProfileValues> & {
  id?: string | null;
  email?: string | null;
};

export type ProfileBasicsDraftRecord = Partial<BasicProfileValues> & {
  id?: string | null;
};

export type OptionalProfileRecord = {
  id?: string | null;
} | null;

export type OnboardingStatus =
  | 'guest'
  | 'checking'
  | 'profile-basics-required'
  | 'optional-profile-details'
  | 'fully-onboarded'
  | 'recovery';

export type OnboardingState = {
  status: OnboardingStatus;
  userId: string | null;
  canAccessMainApp: boolean;
  prefill: BasicProfileValues;
  missingFields: RequiredProfileField[];
  reason?: string;
};

export type EvaluateOnboardingInput = {
  userId?: string | null;
  profile?: OnboardingProfileRecord | null;
  draft?: ProfileBasicsDraftRecord | null;
  socialLinks?: OptionalProfileRecord;
  profileError?: Error | null;
  draftError?: Error | null;
  socialLinksError?: Error | null;
};

const EMPTY_PREFILL: BasicProfileValues = {
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

const USERNAME_PATTERN = /^[a-z0-9._!@#$%^&*()+=\-[\]{}|;:,<>?/~`]+$/;
const VALID_GENDERS = new Set(['male', 'female', 'other']);

const cleanString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

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
  if (!value) {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return false;
  }

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

const mergePrefill = (
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

const getMissingFields = (values: BasicProfileValues): RequiredProfileField[] =>
  REQUIRED_FIELDS.filter((field) => !isFieldValid(field, values[field]));

const hasInvalidSavedProfileValue = (profile: OnboardingProfileRecord | null | undefined) => {
  if (!profile) {
    return false;
  }

  const normalized = normalizeBasics(profile);
  return REQUIRED_FIELDS.some((field) => {
    const rawValue = profile[field];
    const hasSavedValue = typeof rawValue === 'string' && rawValue.trim().length > 0;
    return hasSavedValue && !isFieldValid(field, normalized[field]);
  });
};

export const createCheckingOnboardingState = (userId?: string | null): OnboardingState => ({
  status: 'checking',
  userId: userId ?? null,
  canAccessMainApp: false,
  prefill: EMPTY_PREFILL,
  missingFields: [],
});

export const evaluateOnboardingState = ({
  userId = null,
  profile = null,
  draft = null,
  socialLinks = null,
  profileError = null,
  draftError = null,
  socialLinksError = null,
}: EvaluateOnboardingInput): OnboardingState => {
  if (!userId) {
    return {
      status: 'guest',
      userId: null,
      canAccessMainApp: false,
      prefill: EMPTY_PREFILL,
      missingFields: [],
    };
  }

  const prefill = mergePrefill(profile, draft);

  if (profileError) {
    return {
      status: 'recovery',
      userId,
      canAccessMainApp: false,
      prefill,
      missingFields: getMissingFields(prefill),
      reason: 'backend-read-failed',
    };
  }

  if (hasInvalidSavedProfileValue(profile)) {
    return {
      status: 'recovery',
      userId,
      canAccessMainApp: false,
      prefill,
      missingFields: getMissingFields(prefill),
      reason: 'invalid-profile-data',
    };
  }

  const missingFields = getMissingFields(prefill);
  if (!profile || missingFields.length > 0) {
    return {
      status: 'profile-basics-required',
      userId,
      canAccessMainApp: false,
      prefill,
      missingFields,
    };
  }

  if (!socialLinks) {
    return {
      status: 'optional-profile-details',
      userId,
      canAccessMainApp: true,
      prefill,
      missingFields: [],
    };
  }

  return {
    status: 'fully-onboarded',
    userId,
    canAccessMainApp: true,
    prefill,
    missingFields: [],
  };
};

export const canAccessMainApp = (state: OnboardingState | null | undefined) =>
  state?.canAccessMainApp === true;

export const getRouteForOnboardingState = (
  state: OnboardingState | null | undefined,
  options: { preferOptionalDetails?: boolean } = {},
): AppRoute => {
  if (!state) {
    return ROUTES.auth;
  }

  switch (state.status) {
    case 'guest':
      return ROUTES.auth;
    case 'checking':
      return ROUTES.auth;
    case 'profile-basics-required':
      return ROUTES.onboardingBasic;
    case 'recovery':
      return ROUTES.onboardingRecovery;
    case 'optional-profile-details':
      return options.preferOptionalDetails ? ROUTES.onboardingComplete : ROUTES.home;
    case 'fully-onboarded':
      return ROUTES.home;
    default:
      return ROUTES.auth;
  }
};

export type UsernameAvailabilityInput = {
  requestedUsername: string;
  currentUserId?: string | null;
  ownerId?: string | null;
  suggestions?: string[];
};

export type UsernameAvailabilityResult = {
  isAvailable: boolean;
  suggestions: string[];
};

export const evaluateUsernameAvailability = ({
  currentUserId,
  ownerId,
  suggestions = [],
}: UsernameAvailabilityInput): UsernameAvailabilityResult => {
  if (!ownerId || ownerId === currentUserId) {
    return { isAvailable: true, suggestions: [] };
  }

  return { isAvailable: false, suggestions };
};
