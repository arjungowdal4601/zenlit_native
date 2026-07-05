import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { isAuthReady, signInWithEmailOtp, verifyEmailOtp } from '../../src/services/authService';
import { logger } from '../../src/utils/logger';
import { styles } from './verifyOtp.styles';

const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const COOLDOWN_SECONDS = 60;

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const isComplete = useMemo(() => {
    return code.length === 6;
  }, [code]);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown(COOLDOWN_SECONDS); // Start with initial cooldown
  }, []);

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);
    setError('');
    setStatus('');
  };

  const handleVerify = async () => {
    if (!isComplete || verifying) {
      return;
    }

    if (!isAuthReady()) {
      logger.error('Auth', 'Supabase not configured for OTP verification');
      setError('Authentication service is not available. Please contact support.');
      return;
    }

    const maskedEmail = (email || '').replace(/(.{2})(.*)(@.*)/, '$1***$3');

    setVerifying(true);
    setError('');
    setStatus('');

    try {
      const { user, error } = await verifyEmailOtp(email || '', code);

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
    if (cooldown > 0 || resending) {
      return;
    }

    const maskedEmail = (email || '').replace(/(.{2})(.*)(@.*)/, '$1***$3');

    setResending(true);
    setError('');
    setStatus('');

    try {
      const { error } = await signInWithEmailOtp(email || '');

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
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
              <Feather name="arrow-left" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <GradientTitle text="Zenlit" style={styles.brandTitle} />
            <Text style={styles.brandSubtitle}>Verify your identity</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoBanner}>
              <Feather name="mail" size={18} color="#60a5fa" />
              <Text style={styles.infoText}>
                Code sent to <Text style={styles.infoTextStrong}>{email || 'your email'}</Text>
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
                colors={PRIMARY_GRADIENT}
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

