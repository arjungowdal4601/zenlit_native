import { supabase } from '../lib/supabase';
import {
  evaluateOnboardingState,
  type BasicProfileValues,
  type OnboardingProfileRecord,
  type OnboardingState,
  type ProfileBasicsDraftRecord,
} from '../utils/onboardingState';
import {
  getMissingFields,
  getValidProfileBasicsDraftValues,
  normalizeProfileBasicsInput,
} from '../utils/onboardingProfileFields';
import type { ProfileData } from '../utils/profileValidation';
import { toError } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/async';

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

type SupabaseReadResponse = { data: any; error: any };

const getAuthenticatedUser = async (userId?: string | null) => {
  const { data, error } = await withTimeout<SupabaseReadResponse>(supabase.auth.getUser(), 'Authenticated user check');
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }

  if (userId && userId !== data.user.id) {
    throw new Error('Authenticated user mismatch');
  }

  return { id: data.user.id, email: data.user.email ?? null };
};

const toProfileData = (values: ProfileBasicsInput): ProfileData => {
  const normalized = normalizeProfileBasicsInput(values);
  const missingFields = getMissingFields(normalized);
  if (missingFields.length > 0) {
    throw new Error('Profile basics are invalid');
  }

  return {
    display_name: normalized.display_name as string,
    user_name: normalized.user_name as string,
    date_of_birth: normalized.date_of_birth as string,
    gender: normalized.gender as ProfileData['gender'],
  };
};

export const resolveOnboardingState = async (
  options: ResolveOnboardingOptions = {},
): Promise<OnboardingState> => {
  try {
    const { data, error } = await withTimeout<SupabaseReadResponse>(supabase.auth.getUser(), 'Onboarding auth check');
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
    ] = await withTimeout<[SupabaseReadResponse, SupabaseReadResponse]>(
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
      profileError: profileError ? toError(profileError, 'Failed to load profile') : null,
      draftError: draftError ? toError(draftError, 'Failed to load setup draft') : null,
    });
  } catch (error) {
    logger.error('Onboarding', 'Failed to resolve onboarding state', error);
    return evaluateOnboardingState({
      userId: options.userId ?? null,
      profileError: toError(error, 'Failed to resolve onboarding'),
    });
  }
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
    const payload = getValidProfileBasicsDraftValues(values);

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
    return { data: null, error: toError(error, 'Failed to save setup draft') };
  }
};

export const saveRequiredProfileBasics = async (
  values: ProfileBasicsInput,
  userId?: string | null,
): Promise<ServiceResult<OnboardingState>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    const profileData = toProfileData(values);

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
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to save required profile basics', error);
    return { data: null, error: toError(error, 'Failed to save profile basics') };
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
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to save optional profile details', error);
    return { data: null, error: toError(error, 'Failed to save optional profile details') };
  }
};

export const skipOptionalProfileDetails = async (
  userId?: string | null,
): Promise<ServiceResult<OnboardingState>> => {
  try {
    const user = await getAuthenticatedUser(userId);
    await markOptionalProfileComplete(user.id);
    const state = await resolveOnboardingState({ userId: user.id });
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to skip optional profile details', error);
    return { data: null, error: toError(error, 'Failed to skip optional details') };
  }
};
