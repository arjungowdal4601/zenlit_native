import { normalizeEmail } from './authEmail';

const PENDING_OTP_EMAIL_KEY = 'zenlit.auth.pendingOtpEmail';

const getSessionStorage = (): Storage | null => {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
};

export const storePendingOtpEmail = (value: string) => {
  const email = normalizeEmail(value);
  const storage = getSessionStorage();
  if (!email || !storage) return false;

  try {
    storage.setItem(PENDING_OTP_EMAIL_KEY, email);
    return true;
  } catch {
    return false;
  }
};

export const readPendingOtpEmail = () => {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    return normalizeEmail(storage.getItem(PENDING_OTP_EMAIL_KEY));
  } catch {
    return null;
  }
};

export const clearPendingOtpEmail = () => {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(PENDING_OTP_EMAIL_KEY);
  } catch {}
};
