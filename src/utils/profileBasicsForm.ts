import { normalizeProfileBasicsInput, isBasicProfileFieldValid } from './onboardingProfileFields';
import { validateDateOfBirth, validateDisplayName, validateUsername } from './profileValidation';

export type ProfileBasicsFormValues = {
  displayName: string;
  username: string;
  dob: string;
  gender: string;
};

export type ProfileBasicsFormSubmitValues = ProfileBasicsFormValues & {
  usernameAvailable: boolean | null;
  isCheckingUsername: boolean;
};

export type ProfileBasicsFormErrors = {
  displayName: string;
  username: string;
  dob: string;
  gender: string;
};

export const EMPTY_PROFILE_BASICS_FORM_ERRORS: ProfileBasicsFormErrors = {
  displayName: '',
  username: '',
  dob: '',
  gender: '',
};

export const getProfileBasicsFormErrors = ({
  displayName,
  username,
  dob,
  gender,
}: ProfileBasicsFormValues): ProfileBasicsFormErrors => {
  const nextErrors = { ...EMPTY_PROFILE_BASICS_FORM_ERRORS };
  const values = normalizeProfileBasicsInput({
    display_name: displayName,
    user_name: username,
    date_of_birth: dob,
    gender,
  });

  const dnRes = validateDisplayName(values.display_name ?? '');
  if (!dnRes.isValid) {
    nextErrors.displayName = dnRes.error || 'Display name is invalid';
  }

  const unRes = validateUsername(values.user_name ?? '');
  if (!unRes.isValid) {
    nextErrors.username = unRes.error || 'Username is invalid';
  }

  if (!values.date_of_birth) {
    nextErrors.dob = 'Date of birth is required';
  } else {
    const dobRes = validateDateOfBirth(values.date_of_birth);
    if (!dobRes.isValid) {
      nextErrors.dob = dobRes.error || 'Date of birth is invalid';
    }
  }

  if (!isBasicProfileFieldValid('gender', values.gender)) {
    nextErrors.gender = 'Please select your gender';
  }

  return nextErrors;
};

export const canSubmitProfileBasics = ({
  usernameAvailable,
  isCheckingUsername,
  ...values
}: ProfileBasicsFormSubmitValues) => {
  const errors = getProfileBasicsFormErrors(values);
  return (
    !errors.displayName &&
    !errors.username &&
    !errors.dob &&
    !errors.gender &&
    usernameAvailable === true &&
    !isCheckingUsername
  );
};
