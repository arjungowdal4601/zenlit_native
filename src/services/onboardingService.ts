import { supabase } from '../lib/supabase';
import {
  evaluateOnboardingState,
  type BasicProfileValues,
  type OnboardingProfileRecord,
  type OnboardingState,
  type ProfileBasicsDraftRecord,
} from '../utils/onboardingState';
import {
  formatDate,
  normalizeGender,
  parseDobString,
  validateDateOfBirth,
  validateDisplayName,
  validateProfileData,
  validateUsername,
  type ProfileData,
} from '../utils/profileValidation';
import { logger } from '../utils/logger';

type ResolveOnboardingOptions = {
  userId?: string | null;
};

type ProfileBasicsInput = {
  display_name: string;
  user_name: string;
  date_of_birth: string;
  gender: string;
};

type OptionalProfileDetailsInput = {
  bio?: string | null;
  instagram?: string | null;
  x_twitter?: string | null;
  linkedin?: string | null;
  profile_pic_url?: string | null;
  banner_url?: string | null;
};

type ServiceResult<T> = {
  data: T | null;
  error: Error | null;
};

type OnboardingStateListener = (state: OnboardingState) => void;
type SupabaseReadResponse = { data: any; error: any };

const onboardingStateListeners = new Set<OnboardingStateListener>();
const ONBOARDING_REQUEST_TIMEOUT_MS = 8000;

export const subscribeToOnboardingState = (listener: OnboardingStateListener) => {
  onboardingStateListeners.add(listener);
  return () => void onboardingStateListeners.delete(listener);
};

const publishOnboardingState = (state: OnboardingState) => onboardingStateListeners.forEach((listener) => listener(state));

const withOnboardingTimeout = async <T>(request: PromiseLike<T>, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ONBOARDING_REQUEST_TIMEOUT_MS);
  });
  return Promise.race([Promise.resolve(request), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

const asError = (value: unknown, fallback: string): Error => {
  if (value instanceof Error) return value;

  if (typeof value === 'object' && value && 'message' in value) {
    const details = ['message', 'code', 'details', 'hint']
      .map((key) => String((value as Record<string, unknown>)[key] ?? ''))
      .filter(Boolean)
      .join(' ');
    return new Error(details || fallback);
  }

  return new Error(fallback);
};

const getAuthenticatedUser = async (userId?: string | null) => {
  const { data, error } = await withOnboardingTimeout<SupabaseReadResponse>(supabase.auth.getUser(), 'Authenticated user check');
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }

  if (userId && userId !== data.user.id) {
    throw new Error('Authenticated user mismatch');
  }

  return { id: data.user.id, email: data.user.email ?? null };
};

const normalizeDraftPayload = (values: Partial<ProfileBasicsInput>) => {
  const displayName = values.display_name?.trim() ?? '';
  const username = values.user_name?.trim().toLowerCase() ?? '';
  const rawDob = values.date_of_birth?.trim() ?? '';
  const rawGender = values.gender?.trim() ?? '';
  const normalizedGender = rawGender ? normalizeGender(rawGender) : null;
  const parsedDob = parseDobString(rawDob);
  const dobValue = parsedDob ? formatDate(parsedDob) : rawDob;

  return {
    display_name: validateDisplayName(displayName).isValid ? displayName : null,
    user_name: validateUsername(username).isValid ? username : null,
    date_of_birth: validateDateOfBirth(dobValue).isValid ? dobValue : null,
    gender: normalizedGender ? normalizedGender : null,
  };
};

export const resolveOnboardingState = async (
  options: ResolveOnboardingOptions = {},
): Promise<OnboardingState> => {
  try {
    const { data, error } = await withOnboardingTimeout<SupabaseReadResponse>(supabase.auth.getUser(), 'Onboarding auth check');
    if (error || !data.user) {
      return evaluateOnboardingState({ userId: null });
    }

    if (options.userId && options.userId !== data.user.id) {
      throw new Error('Authenticated user mismatch');
    }

    const userId = data.user.id;

    const [
      { data: profile, error: profileError },
      { data: draft, error: draftError },
    ] = await withOnboardingTimeout<[SupabaseReadResponse, SupabaseReadResponse]>(
      Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, user_name, date_of_birth, gender, email, optional_profile_completed_at')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('profile_basics_drafts')
          .select('id, display_name, user_name, date_of_birth, gender')
          .eq('id', userId)
          .maybeSingle(),
      ]),
      'Onboarding profile check',
    );

    return evaluateOnboardingState({
      userId,
      profile: profile as OnboardingProfileRecord | null,
      draft: draft as ProfileBasicsDraftRecord | null,
      profileError: profileError ? asError(profileError, 'Failed to load profile') : null,
      draftError: draftError ? asError(draftError, 'Failed to load setup draft') : null,
    });
  } catch (error) {
    logger.error('Onboarding', 'Failed to resolve onboarding state', error);
    return evaluateOnboardingState({
      userId: options.userId ?? null,
      profileError: asError(error, 'Failed to resolve onboarding'),
    });
  }
};

export const refreshPublishedOnboardingState = async (
  options: ResolveOnboardingOptions = {},
): Promise<OnboardingState> => {
  const state = await resolveOnboardingState(options);
  publishOnboardingState(state);
  return state;
};

const markOptionalProfileComplete = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ optional_profile_completed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
};

export const saveProfileBasicsDraft = async (
  values: Partial<ProfileBasicsInput>,
  userId?: string | null,
): Promise<ServiceResult<BasicProfileValues>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    const payload = normalizeDraftPayload(values);

    const hasAnyDraftValue = Object.values(payload).some((value) => value !== null);
    if (!hasAnyDraftValue) {
      return { data: payload, error: null };
    }

    const { error } = await supabase
      .from('profile_basics_drafts')
      .upsert(
        {
          id: user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (error) {
      throw error;
    }

    return { data: payload, error: null };
  } catch (error) {
    logger.warn('Onboarding', 'Failed to save profile basics draft', error);
    return { data: null, error: asError(error, 'Failed to save setup draft') };
  }
};

export const saveRequiredProfileBasics = async (
  values: ProfileBasicsInput,
  userId?: string | null,
): Promise<ServiceResult<OnboardingState>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    const parsedDob = parseDobString(values.date_of_birth);
    const profileData: ProfileData = {
      display_name: values.display_name.trim(),
      user_name: values.user_name.trim().toLowerCase(),
      date_of_birth: parsedDob ? formatDate(parsedDob) : values.date_of_birth.trim(),
      gender: normalizeGender(values.gender),
    };

    const validation = validateProfileData(profileData);
    if (!validation.isValid) throw new Error(validation.error ?? 'Profile basics are invalid');

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, ...profileData }, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    void supabase
      .from('profile_basics_drafts')
      .delete()
      .eq('id', user.id)
      .then(({ error: draftError }: { error: unknown }) => {
        if (draftError) logger.warn('Onboarding', 'Failed to delete profile basics draft', draftError);
      }, (draftError: unknown) => {
        logger.warn('Onboarding', 'Failed to delete profile basics draft', draftError);
      });

    const state = evaluateOnboardingState({
      userId: user.id,
      profile: { id: user.id, email: user.email, ...profileData, optional_profile_completed_at: null },
    });
    publishOnboardingState(state);
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to save required profile basics', error);
    return { data: null, error: asError(error, 'Failed to save profile basics') };
  }
};

export const saveOptionalProfileDetails = async (
  values: OptionalProfileDetailsInput,
  userId?: string | null,
): Promise<ServiceResult<OnboardingState>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    const payload = {
      id: user.id,
      bio: values.bio?.trim() || null,
      instagram: values.instagram?.trim() || null,
      x_twitter: values.x_twitter?.trim() || null,
      linkedin: values.linkedin?.trim() || null,
      profile_pic_url: values.profile_pic_url ?? null,
      banner_url: values.banner_url ?? null,
    };

    const hasOptionalData = Object.entries(payload)
      .some(([key, value]) => key !== 'id' && value !== null);

    if (hasOptionalData) {
      const { error } = await supabase
        .from('social_links')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    }

    await markOptionalProfileComplete(user.id);
    const state = await resolveOnboardingState({ userId: user.id });
    publishOnboardingState(state);
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to save optional profile details', error);
    return { data: null, error: asError(error, 'Failed to save optional profile details') };
  }
};

export const skipOptionalProfileDetails = async (
  userId?: string | null,
): Promise<ServiceResult<OnboardingState>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    await markOptionalProfileComplete(user.id);
    const state = await resolveOnboardingState({ userId: user.id });
    publishOnboardingState(state);
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to skip optional profile details', error);
    return { data: null, error: asError(error, 'Failed to skip optional details') };
  }
};
