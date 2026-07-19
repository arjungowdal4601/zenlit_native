import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { isAuthReady, signInWithEmailOtp, verifyEmailOtp } from '../services/authService';
import { logger } from '../utils/logger';
import { getEmailOtpErrorMessage, getVerifyOtpErrorMessage, maskEmail, normalizeEmail } from '../utils/authEmail';
import { ROUTES } from '../utils/onboardingState';
import {
  clearPendingOtpEmail,
  readPendingOtpEmail,
} from '../utils/pendingOtpEmail';

const COOLDOWN_SECONDS = 60;

export const useVerifyOtp = () => {
  const router = useRouter();
  const { email: routeEmail } = useLocalSearchParams<{ email?: string | string[] }>();
  const [email] = useState(() => readPendingOtpEmail() ?? normalizeEmail(routeEmail));
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const isComplete = code.length === 6;

  useEffect(() => {
    if (email) setCooldown(COOLDOWN_SECONDS);
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCodeChange = (text: string) => {
    setCode(text.replace(/[^0-9]/g, ''));
    setError('');
    setStatus('');
  };

  const handleVerify = async () => {
    if (!email || !isComplete || verifying) return;

    if (!isAuthReady()) {
      logger.error('Auth', 'Supabase not configured for OTP verification');
      setError('Authentication service is not available. Please contact support.');
      return;
    }

    const maskedEmail = maskEmail(email);
    setVerifying(true);
    setError('');
    setStatus('');

    try {
      const { user, error: verifyError } = await verifyEmailOtp(email, code);
      if (verifyError) {
        logger.error('Auth', 'OTP verification failed', {
          email: maskedEmail,
          errorName: verifyError.name,
          errorMessage: verifyError.message,
        });

        setError(getVerifyOtpErrorMessage(verifyError));
        setVerifying(false);
        return;
      }

      if (user) {
        clearPendingOtpEmail();
        setStatus('Code verified. Checking setup...');
      } else {
        logger.error('Auth', 'OTP verification returned no user');
        setError('Verification failed. Please try again.');
        setVerifying(false);
      }
    } catch (verifyException: any) {
      logger.error('Auth', 'OTP verification exception', {
        email: maskedEmail,
        error: verifyException?.message || String(verifyException),
      });
      setError('Something went wrong. Please try again.');
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;

    const maskedEmail = maskEmail(email);
    setResending(true);
    setError('');
    setStatus('');

    try {
      const { error: resendError } = await signInWithEmailOtp(email);
      if (resendError) {
        logger.error('Auth', 'OTP resend failed', {
          email: maskedEmail,
          errorMessage: resendError.message,
        });

        setError(getEmailOtpErrorMessage(resendError));
        setResending(false);
        return;
      }

      setStatus('We sent a new code to your inbox.');
      setCooldown(COOLDOWN_SECONDS);
      setResending(false);
    } catch (resendException: any) {
      logger.error('Auth', 'OTP resend exception', {
        email: maskedEmail,
        error: resendException?.message || String(resendException),
      });
      setError('Failed to resend code. Please try again.');
      setResending(false);
    }
  };

  return {
    code,
    cooldown,
    email,
    error,
    handleBack: () => {
      clearPendingOtpEmail();
      router.replace(ROUTES.auth);
    },
    handleCodeChange,
    handleResend,
    handleVerify,
    isComplete,
    resending,
    status,
    verifying,
  };
};

export type VerifyOtpViewModel = ReturnType<typeof useVerifyOtp>;
