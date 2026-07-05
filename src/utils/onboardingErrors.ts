export const getFriendlyOnboardingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message.includes('23505') || message.toLowerCase().includes('duplicate')) {
    return 'That username is already taken. Please choose another.';
  }

  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'We could not connect right now. Please check your connection and try again.';
  }

  if (message.toLowerCase().includes('not authenticated')) {
    return 'Your session expired. Please sign in again.';
  }

  return 'Something went wrong. Please try again.';
};
