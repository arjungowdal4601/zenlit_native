const getErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || !error) return String(error ?? '');

  return ['message', 'code', 'details', 'hint']
    .map((key) => String((error as Record<string, unknown>)[key] ?? ''))
    .filter(Boolean)
    .join(' ');
};

export const isDuplicateUsernameError = (error: unknown) => {
  const message = getErrorText(error).toLowerCase();
  return message.includes('profiles_user_name_key') || message.includes('user_name');
};

export const isDuplicateProfileEmailError = (error: unknown) => {
  const message = getErrorText(error).toLowerCase();
  return message.includes('profiles_email_key') || message.includes('(email)');
};

export const getFriendlyOnboardingError = (error: unknown) => {
  const message = getErrorText(error);
  const lowerMessage = message.toLowerCase();

  if (isDuplicateUsernameError(error)) {
    return 'That username is already taken. Please choose another.';
  }

  if (isDuplicateProfileEmailError(error)) {
    return 'This email is still linked to another profile. Please sign out and try again.';
  }

  if (message.includes('23505') || lowerMessage.includes('duplicate')) {
    return 'Those profile details are already linked to another account.';
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'We could not connect right now. Please check your connection and try again.';
  }

  if (lowerMessage.includes('not authenticated')) {
    return 'Your session expired. Please sign in again.';
  }

  return 'Something went wrong. Please try again.';
};
