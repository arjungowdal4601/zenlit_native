import { supabase } from '../lib/supabase';
import {
  evaluateOnboardingState,
  type BasicProfileValues,
  type OnboardingProfileRecord,
  type OnboardingState,
  type ProfileBasicsDraftRecord,
} from '../utils/onboardingState';
import type {
  OptionalProfileDetailsInput,
  ProfileBasicsInput,
  ResolveOnboardingOptions,
  ServiceResult,
} from '../types/onboarding';
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

const asError = (value: unknown, fallback: string): Error => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'object' && value && 'message' in value) {
    return new Error(String((value as { message?: unknown }).message ?? fallback));
  }

  return new Error(fallback);
};

const getAuthenticatedUser = async (userId?: string | null) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }

  if (userId && userId !== data.user.id) {
    throw new Error('Authenticated user mismatch');
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
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
    const { data, error } = await supabase.auth.getUser();
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
      { data: socialLinks, error: socialLinksError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, user_name, date_of_birth, gender, email')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('profile_basics_drafts')
        .select('id, display_name, user_name, date_of_birth, gender')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('social_links')
        .select('id')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    return evaluateOnboardingState({
      userId,
      profile: profile as OnboardingProfileRecord | null,
      draft: draft as ProfileBasicsDraftRecord | null,
      socialLinks: socialLinks ? { id: socialLinks.id } : null,
      profileError: profileError ? asError(profileError, 'Failed to load profile') : null,
      draftError: draftError ? asError(draftError, 'Failed to load setup draft') : null,
      socialLinksError: socialLinksError
        ? asError(socialLinksError, 'Failed to load optional profile')
        : null,
    });
  } catch (error) {
    logger.error('Onboarding', 'Failed to resolve onboarding state', error);
    return evaluateOnboardingState({
      userId: options.userId ?? null,
      profileError: asError(error, 'Failed to resolve onboarding'),
    });
  }
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
    const normalizedGender = normalizeGender(values.gender);
    const parsedDob = parseDobString(values.date_of_birth);
    const dateOfBirth = parsedDob ? formatDate(parsedDob) : values.date_of_birth.trim();
    const profileData: ProfileData = {
      display_name: values.display_name.trim(),
      user_name: values.user_name.trim().toLowerCase(),
      date_of_birth: dateOfBirth,
      gender: normalizedGender,
    };

    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      throw new Error(validation.error ?? 'Profile basics are invalid');
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          display_name: profileData.display_name,
          user_name: profileData.user_name,
          date_of_birth: profileData.date_of_birth,
          gender: profileData.gender,
          email: user.email,
        },
        { onConflict: 'id' },
      );

    if (error) {
      throw error;
    }

    await supabase.from('profile_basics_drafts').delete().eq('id', user.id);

    const state = await resolveOnboardingState({ userId: user.id });
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

    const { error } = await supabase
      .from('social_links')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    const state = await resolveOnboardingState({ userId: user.id });
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
    const { error } = await supabase
      .from('social_links')
      .upsert(
        {
          id: user.id,
          bio: null,
          instagram: null,
          x_twitter: null,
          linkedin: null,
          profile_pic_url: null,
          banner_url: null,
        },
        { onConflict: 'id' },
      );

    if (error) {
      throw error;
    }

    const state = await resolveOnboardingState({ userId: user.id });
    return { data: state, error: null };
  } catch (error) {
    logger.error('Onboarding', 'Failed to skip optional profile details', error);
    return { data: null, error: asError(error, 'Failed to skip optional details') };
  }
};
