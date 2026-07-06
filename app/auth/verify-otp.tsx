import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { isAuthReady, signInWithEmailOtp, verifyEmailOtp } from '../../src/services/authService';
import { logger } from '../../src/utils/logger';
import { styles } from '../../src/styles/verifyOtp.styles';
import { prismGradientColors, theme } from '../../src/styles/theme';

const COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeRouteEmail = (value?: string | string[]) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
};

export default function VerifyOTPScreen() {
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

  const isComplete = useMemo(() => {
    return code.length === 6;
  }, [code]);

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
    if (!email) {
      router.replace('/auth');
      return undefined;
    }

    startCooldown(COOLDOWN_SECONDS);
    return clearCooldown;
  }, [email, router]);

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);
    setError('');
    setStatus('');
  };

  const handleVerify = async () => {
    if (!email || !isComplete || verifying) {
      return;
    }

    if (!isAuthReady()) {
      logger.error('Auth', 'Supabase not configured for OTP verification');
      setError('Authentication service is not available. Please contact support.');
      return;
    }

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    setVerifying(true);
    setError('');
    setStatus('');

    try {
      const { user, error } = await verifyEmailOtp(email, code);

      if (error) {
        logger.error('Auth', 'OTP verification failed', {
          email: maskedEmail,
          errorName: error.name,
          errorMessage: error.message,
        });

        let userMessage = 'We could not verify that code. Please try again.';

        if (error.message.includes('expired') || error.message.includes('invalid')) {
          userMessage = 'This code has expired or is invalid. Please request a new code.';
        } else if (error.message.includes('not found')) {
          userMessage = 'Invalid verification code. Please check and try again.';
        }

        setError(userMessage);
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
    } catch (error: any) {
      logger.error('Auth', 'OTP verification exception', {
        email: maskedEmail,
        error: error?.message || String(error),
      });
      setError('Something went wrong. Please try again.');
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) {
      return;
    }

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    setResending(true);
    setError('');
    setStatus('');

    try {
      const { error } = await signInWithEmailOtp(email);

      if (error) {
        logger.error('Auth', 'OTP resend failed', {
          email: maskedEmail,
          errorMessage: error.message,
        });

        let userMessage = 'We could not resend the code. Please try again.';

        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          userMessage = 'Too many attempts. Please wait a few minutes before requesting a new code.';
        }

        setError(userMessage);
        setResending(false);
        return;
      }

      setStatus('We sent a new code to your inbox.');
      startCooldown(COOLDOWN_SECONDS);
      setResending(false);
    } catch (error: any) {
      logger.error('Auth', 'OTP resend exception', {
        email: maskedEmail,
        error: error?.message || String(error),
      });
      setError('Failed to resend code. Please try again.');
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/auth')}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={theme.prism.colors.text} />
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <GradientTitle text="Zenlit" style={styles.brandTitle} variant="prism" />
            <Text style={styles.brandSubtitle}>Verify your identity</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoBanner}>
              <Feather name="mail" size={18} color={theme.prism.colors.accent} />
              <Text style={styles.infoText}>
                Code sent to <Text style={styles.infoTextStrong}>{email}</Text>
              </Text>
            </View>

            {status ? <Text style={styles.statusText}>{status}</Text> : null}
            {error ? (
              <Text style={[styles.errorText, status ? styles.errorWithStatus : null]}>{error}</Text>
            ) : null}

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Enter 6-digit code</Text>
              <View style={styles.otpWrapper}>
                <TextInput
                  value={code}
                  onChangeText={handleChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  inputMode="numeric"
                  maxLength={6}
                  accessibilityLabel="OTP code"
                  autoFocus
                  style={styles.otpInput}
                />
                {code.length === 0 ? (
                  <Text style={styles.ghostCode}>000000</Text>
                ) : null}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!isComplete || verifying}
              onPress={handleVerify}
              style={({ pressed }) => [
                styles.primaryButton,
                (!isComplete || verifying) ? styles.disabled : null,
                pressed && isComplete && !verifying ? styles.primaryButtonPressed : null,
              ]}
            >
              <LinearGradient
                colors={prismGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>
                  {verifying ? 'Verifying...' : 'Verify & Continue'}
                </Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.resendBlock}>
              {cooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  Resend code in <Text style={styles.cooldownStrong}>{cooldown}s</Text>
                </Text>
              ) : (
                <Pressable accessibilityRole="button" onPress={handleResend}>
                  <Text style={styles.resendLink}>
                    {resending ? 'Sending...' : 'Resend code'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
