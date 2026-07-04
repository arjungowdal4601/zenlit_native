import {
  formatDate,
  validateDateOfBirth,
  validateDisplayName,
  validateUsername,
} from './profileValidation';

export type ProfileBasicsFormValues = {
  displayName: string;
  username: string;
  dob: string;
  dobDate: Date | null;
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
  dobDate,
  gender,
}: ProfileBasicsFormValues): ProfileBasicsFormErrors => {
  const nextErrors = { ...EMPTY_PROFILE_BASICS_FORM_ERRORS };

  const dnRes = validateDisplayName(displayName.trim());
  if (!dnRes.isValid) {
    nextErrors.displayName = dnRes.error || 'Display name is invalid';
  }

  const unRes = validateUsername(username.trim());
  if (!unRes.isValid) {
    nextErrors.username = unRes.error || 'Username is invalid';
  }

  if (!(dob.trim().length > 0 || dobDate)) {
    nextErrors.dob = 'Date of birth is required';
  } else {
    const dobStr = dobDate ? formatDate(dobDate) : dob;
    const dobRes = validateDateOfBirth(dobStr);
    if (!dobRes.isValid) {
      nextErrors.dob = dobRes.error || 'Date of birth is invalid';
    }
  }

  if (!gender.trim().length) {
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
