import {
  EMPTY_PREFILL,
  getMissingFields,
  hasInvalidSavedProfileValue,
  mergePrefill,
} from './onboardingProfileFields';

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

  if (draftError) {
    return {
      status: 'recovery',
      userId,
      canAccessMainApp: false,
      prefill,
      missingFields: getMissingFields(prefill),
      reason: 'draft-read-failed',
    };
  }

  if (socialLinksError) {
    return {
      status: 'recovery',
      userId,
      canAccessMainApp: false,
      prefill,
      missingFields: getMissingFields(prefill),
      reason: 'optional-profile-read-failed',
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

export const shouldRefreshBeforeOnboardingRedirect = (
  state: OnboardingState | null | undefined,
  pathname: string | null | undefined,
) =>
  state?.status === 'profile-basics-required' &&
  pathname === ROUTES.onboardingComplete;
