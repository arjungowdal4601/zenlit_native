const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');

export const normalizeEmail = (value?: string | string[] | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
};

export const maskEmail = (email: string) => email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

export const getEmailOtpErrorMessage = (error: unknown) => {
  const message = getErrorText(error).toLowerCase();

  if (message.includes('not configured') || message.includes('authentication service is not configured')) {
    return 'Authentication service is not properly configured. Please contact support.';
  }
  if (message.includes('signups not allowed')) {
    return 'New account creation is currently disabled. Please contact support if you need access.';
  }
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to authentication service. Please check your internet connection.';
  }

  return 'Unable to send verification code. Please try again.';
};

export const getEmailOtpExceptionMessage = (error: unknown) => {
  const message = getErrorText(error).toLowerCase();

  if (message.includes('not configured')) {
    return 'Authentication service is not properly configured. Please contact support.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  return 'Unable to send verification code. Please try again.';
};

export const getVerifyOtpErrorMessage = (error: unknown) => {
  const message = getErrorText(error).toLowerCase();

  if (message.includes('expired') || message.includes('invalid')) {
    return 'This code has expired or is invalid. Please request a new code.';
  }
  if (message.includes('not found')) {
    return 'Invalid verification code. Please check and try again.';
  }

  return 'We could not verify that code. Please try again.';
};
