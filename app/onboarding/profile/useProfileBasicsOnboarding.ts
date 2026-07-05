import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { getCurrentUser } from '../../../src/services/authService';
import { resolveOnboardingState, saveProfileBasicsDraft, saveRequiredProfileBasics } from '../../../src/services/onboardingService';
import { checkUsernameAvailability } from '../../../src/services/profileService';
import { getFriendlyOnboardingError } from '../../../src/utils/onboardingErrors';
import { canSubmitProfileBasics, EMPTY_PROFILE_BASICS_FORM_ERRORS, getProfileBasicsFormErrors } from '../../../src/utils/profileBasicsForm';
import { formatDate, normalizeGender, parseDobString, validateProfileData, validateUsername, type ProfileData } from '../../../src/utils/profileValidation';
import { canAccessMainApp, getRouteForOnboardingState, ROUTES } from '../../../src/utils/onboardingState';

export const GENDERS = ['Male', 'Female', 'Others'] as const;
export type GenderOption = typeof GENDERS[number];

const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Others' } as const;
const toGenderOption = (value?: string | null): GenderOption | '' =>
  value && value in GENDER_LABELS ? GENDER_LABELS[value as keyof typeof GENDER_LABELS] : '';

export const useProfileBasicsOnboarding = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [saveError, setSaveError] = useState('');
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const [isWebDateFocused, setIsWebDateFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState(EMPTY_PROFILE_BASICS_FORM_ERRORS);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const usernameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxDobDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const maxDobInputValue = useMemo(() => formatDate(maxDobDate), [maxDobDate]);
  const resolvedDobDate = useMemo(() => {
    if (dobDate) return dobDate;
    const parsed = parseDobString(dob);
    if (parsed) return parsed;
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 18);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }, [dob, dobDate]);

  useEffect(() => {
    let mounted = true;

    const loadSavedProfile = async () => {
      setIsLoadingProfile(true);
      setSaveError('');

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace(ROUTES.auth);
          return;
        }

        const state = await resolveOnboardingState({ userId: user.id });
        if (!mounted) return;

        setCurrentUserId(user.id);

        if (state.status === 'recovery') {
          router.replace(ROUTES.onboardingRecovery);
          return;
        }

        if (canAccessMainApp(state)) {
          router.replace(getRouteForOnboardingState(state));
          return;
        }

        setDisplayName(state.prefill.display_name ?? '');
        setUsername(state.prefill.user_name ?? '');
        setDob(state.prefill.date_of_birth ?? '');
        setDobDate(state.prefill.date_of_birth ? parseDobString(state.prefill.date_of_birth) : null);
        setGender(toGenderOption(state.prefill.gender));
        setHasLoadedProfile(true);
      } catch {
        if (mounted) {
          setSaveError('We could not load your saved setup.');
          setHasLoadedProfile(true);
          router.replace(ROUTES.onboardingRecovery);
        }
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    };

    void loadSavedProfile();
    return () => {
      mounted = false;
    };
  }, [router]);

  const updateDob = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    normalized.setHours(0, 0, 0, 0);
    setDobDate(normalized);
    setDob(formatDate(normalized));
  };

  const handleDobWebChange = (value: string) => {
    if (!value) {
      setDob('');
      setDobDate(null);
      return;
    }

    const parsed = parseDobString(value);
    if (parsed) {
      updateDob(parsed);
      return;
    }

    setDob(value.slice(0, 10));
    setDobDate(null);
  };

  const openDobPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: resolvedDobDate,
        maximumDate: maxDobDate,
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) updateDob(selectedDate);
        },
      });
      return;
    }

    if (Platform.OS === 'ios') setShowIosPicker(true);
  };

  const handleIosDobChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) updateDob(selectedDate);
  };

  const isFilled = useMemo(
    () =>
      canSubmitProfileBasics({
        displayName,
        username,
        dob,
        dobDate,
        gender,
        usernameAvailable,
        isCheckingUsername,
      }),
    [displayName, username, dob, dobDate, gender, usernameAvailable, isCheckingUsername],
  );

  const validateForm = () => {
    const nextErrors = getProfileBasicsFormErrors({ displayName, username, dob, dobDate, gender });
    setErrors(nextErrors);
    return !nextErrors.displayName && !nextErrors.username && !nextErrors.dob && !nextErrors.gender;
  };

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3 || !validateUsername(usernameToCheck).isValid) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const result = await checkUsernameAvailability(usernameToCheck, currentUserId);
      setUsernameAvailable(result.isAvailable);
      setUsernameSuggestions(result.suggestions || []);
    } catch {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    } finally {
      setIsCheckingUsername(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);

    if (username.trim().length >= 3) {
      usernameCheckTimeoutRef.current = setTimeout(() => checkUsername(username.trim()), 500);
    } else {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    }

    return () => {
      if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);
    };
  }, [username, checkUsername]);

  useEffect(() => {
    if (!hasLoadedProfile || !currentUserId || isSubmitting) return;

    const draftTimer = setTimeout(() => {
      void saveProfileBasicsDraft({
        display_name: displayName,
        user_name: username,
        date_of_birth: dobDate ? formatDate(dobDate) : dob,
        gender,
      }, currentUserId);
    }, 700);

    return () => clearTimeout(draftTimer);
  }, [currentUserId, displayName, dob, dobDate, gender, hasLoadedProfile, isSubmitting, username]);

  const handleUsernameChange = (value: string) => {
    setUsername(value.replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase());
    setSaveError('');
    if (errors.username) setErrors((next) => ({ ...next, username: '' }));
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameSuggestions([]);
    setUsernameAvailable(true);
    if (errors.username) setErrors((next) => ({ ...next, username: '' }));
  };

  const handleContinue = async () => {
    if (isSubmitting || !validateForm()) return;
    if (usernameAvailable !== true) {
      setSaveError(isCheckingUsername ? 'Please wait for username availability.' : 'Please choose an available username.');
      return;
    }

    const profileData: ProfileData = {
      display_name: displayName.trim(),
      user_name: username.trim().toLowerCase(),
      date_of_birth: dobDate ? formatDate(dobDate) : dob,
      gender: normalizeGender(gender),
    };

    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      setSaveError(validation.error || 'Please check your profile details.');
      return;
    }

    setIsSubmitting(true);
    setSaveError('');
    try {
      const { data: state, error } = await saveRequiredProfileBasics(profileData, currentUserId);
      if (error || !state) throw error ?? new Error('Could not save your profile.');
      router.replace(getRouteForOnboardingState(state, { preferOptionalDetails: true }));
    } catch (error) {
      setSaveError(getFriendlyOnboardingError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    closeIosPicker: () => setShowIosPicker(false), displayName, dob, errors, gender,
    handleContinue, handleDobWebChange, handleIosDobChange, handleSuggestionSelect, handleUsernameChange,
    isCheckingUsername, isFilled, isLoadingProfile, isSubmitting, isWebDateFocused,
    maxDobDate, maxDobInputValue, openDobPicker, resolvedDobDate, saveError,
    setDisplayName, setErrors, setGender, setIsWebDateFocused, showIosPicker,
    username, usernameAvailable, usernameSuggestions, webDateInputRef,
  };
};
