import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { isAuthReady, signInWithEmailOtp, verifyEmailOtp } from '../services/authService';
import { logger } from '../utils/logger';
import { getEmailOtpErrorMessage, getVerifyOtpErrorMessage, maskEmail, normalizeEmail } from '../utils/authEmail';
import { ROUTES } from '../utils/onboardingState';

const COOLDOWN_SECONDS = 60;
export const normalizeRouteEmail = normalizeEmail;

export const useVerifyOtp = () => {
  const router = useRouter();
  const { email: routeEmail } = useLocalSearchParams<{ email?: string | string[] }>();
  const email = useMemo(() => normalizeRouteEmail(routeEmail), [routeEmail]);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isComplete = code.length === 6;

  const clearCooldown = () => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  };

  const startCooldown = (seconds: number) => {
    clearCooldown();
    setCooldown(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearCooldown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!email) return undefined;

    startCooldown(COOLDOWN_SECONDS);
    return clearCooldown;
  }, [email]);

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
      startCooldown(COOLDOWN_SECONDS);
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
    handleBack: () => router.replace(ROUTES.auth),
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
