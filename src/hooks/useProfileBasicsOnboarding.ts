import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { resolveOnboardingState, saveProfileBasicsDraft, saveRequiredProfileBasics } from '../services/onboardingService';
import { getFriendlyOnboardingError, isDuplicateUsernameError } from '../utils/onboardingErrors';
import { getRouteForOnboardingState } from '../utils/onboardingState';
import { publishOnboardingState } from '../utils/onboardingStateSync';
import { canSubmitProfileBasics, EMPTY_PROFILE_BASICS_FORM_ERRORS, getProfileBasicsFormErrors } from '../utils/profileBasicsForm';
import {
  formatDate,
  normalizeGender,
  parseDobString,
  sanitizeUsernameInput,
} from '../utils/profileValidation';
import { useUsernameAvailability } from './useUsernameAvailability';

export const GENDERS = ['Male', 'Female', 'Others'] as const;
export type GenderOption = typeof GENDERS[number];

const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Others' } as const;
const toGenderOption = (value?: string | null): GenderOption | '' =>
  value && value in GENDER_LABELS ? GENDER_LABELS[value as keyof typeof GENDER_LABELS] : '';
const normalizeDobInput = (value: string) => {
  const parsed = parseDobString(value);
  return parsed ? formatDate(parsed) : value.slice(0, 10);
};

export const useProfileBasicsOnboarding = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [saveError, setSaveError] = useState('');
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const [isWebDateFocused, setIsWebDateFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState(EMPTY_PROFILE_BASICS_FORM_ERRORS);
  const maxDobInputValue = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return formatDate(now);
  }, []);
  const {
    isCheckingUsername,
    setUsernameAvailability,
    usernameAvailable,
    usernameSuggestions,
  } = useUsernameAvailability({ currentUserId, username });

  useEffect(() => {
    let mounted = true;

    const loadSavedProfile = async () => {
      setIsLoadingProfile(true);
      setSaveError('');

      try {
        const state = await resolveOnboardingState();
        if (!mounted) return;

        setCurrentUserId(state.userId);

        setDisplayName(state.prefill.display_name ?? '');
        setUsername(state.prefill.user_name ?? '');
        setDob(state.prefill.date_of_birth ?? '');
        setGender(toGenderOption(state.prefill.gender));
        setHasLoadedProfile(true);
      } catch {
        if (mounted) {
          setSaveError('We could not load your saved setup.');
          setHasLoadedProfile(true);
        }
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    };

    void loadSavedProfile();
    return () => {
      mounted = false;
    };
  }, []);
  const handleDobWebChange = (value: string) => {
    setDob(value ? normalizeDobInput(value) : '');
  };

  const openDobPicker = () => {
    const element = webDateInputRef.current;
    if (!element) return;
    const dateInput = element as HTMLInputElement & { showPicker?: () => void };
    try {
      if (typeof dateInput.showPicker === 'function') dateInput.showPicker();
      else dateInput.focus();
    } catch {
      dateInput.focus();
    }
  };

  const isFilled = useMemo(
    () =>
      canSubmitProfileBasics({
        displayName,
        username,
        dob,
        gender,
        usernameAvailable,
        isCheckingUsername,
      }),
    [displayName, username, dob, gender, usernameAvailable, isCheckingUsername],
  );

  const validateForm = () => {
    const nextErrors = getProfileBasicsFormErrors({ displayName, username, dob, gender });
    setErrors(nextErrors);
    return !nextErrors.displayName && !nextErrors.username && !nextErrors.dob && !nextErrors.gender;
  };

  useEffect(() => {
    if (!hasLoadedProfile || !currentUserId || isSubmitting) return;

    const draftTimer = setTimeout(() => {
      void saveProfileBasicsDraft({
        display_name: displayName,
        user_name: username,
        date_of_birth: normalizeDobInput(dob),
        gender,
      }, currentUserId);
    }, 700);

    return () => clearTimeout(draftTimer);
  }, [currentUserId, displayName, dob, gender, hasLoadedProfile, isSubmitting, username]);

  const handleUsernameChange = (value: string) => {
    setUsernameAvailability(null);
    setUsername(sanitizeUsernameInput(value));
    setSaveError('');
    if (errors.username) setErrors((next) => ({ ...next, username: '' }));
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameAvailability(true);
    setSaveError('');
    if (errors.username) setErrors((next) => ({ ...next, username: '' }));
  };

  const handleContinue = async () => {
    if (isSubmitting || !validateForm()) return;
    if (usernameAvailable !== true) {
      setSaveError(isCheckingUsername ? 'Please wait for username availability.' : 'Please choose an available username.');
      return;
    }

    const profileData = {
      display_name: displayName.trim(),
      user_name: username.trim().toLowerCase(),
      date_of_birth: normalizeDobInput(dob),
      gender: normalizeGender(gender),
    };

    setIsSubmitting(true);
    setSaveError('');
    try {
      const { data, error } = await saveRequiredProfileBasics(profileData, currentUserId);
      if (error || !data) throw error ?? new Error('Failed to save profile basics');
      if (!publishOnboardingState(data)) {
        router.replace(getRouteForOnboardingState(data));
      }
    } catch (error) {
      if (isDuplicateUsernameError(error)) {
        setUsernameAvailability(false);
      }
      setSaveError(getFriendlyOnboardingError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    displayName, dob, errors, gender,
    handleContinue, handleDobWebChange, handleSuggestionSelect, handleUsernameChange,
    isCheckingUsername, isFilled, isLoadingProfile, isSubmitting, isWebDateFocused,
    maxDobInputValue, openDobPicker, saveError,
    setDisplayName, setErrors, setGender, setIsWebDateFocused,
    username, usernameAvailable, usernameSuggestions, webDateInputRef,
  };
};
