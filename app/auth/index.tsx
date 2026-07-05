import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { styles } from './auth.styles';
import { isAuthReady, signInWithEmailOtp } from '../../src/services/authService';
import { logger } from '../../src/utils/logger';

const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const DIVIDER_LINE_COLORS = [
  'rgba(37, 99, 235, 0)',
  'rgba(37, 99, 235, 0.45)',
  'rgba(37, 99, 235, 0)',
] as const;
const DIVIDER_BADGE_COLORS = [
  'rgba(37, 99, 235, 0.35)',
  'rgba(126, 34, 206, 0.45)',
] as const;
const EMAIL_PLACEHOLDER = 'Enter your email';

const AuthScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const cardScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 320,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 320,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [cardOpacity, cardScale, cardTranslate]);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleEmail = async () => {
    if (!isValidEmail || emailLoading) {
      return;
    }

    if (!isAuthReady()) {
      logger.error('Auth', 'Supabase not configured', { authReady: false });
      Alert.alert('Configuration Error', 'Authentication service is not properly configured. Please contact support.');
      return;
    }

    const maskedEmail = email.trim().replace(/(.{2})(.*)(@.*)/, '$1***$3');

    setEmailLoading(true);

    try {
      const { error } = await signInWithEmailOtp(email.trim());

      if (error) {
        logger.error('Auth', 'OTP signin failed', {
          email: maskedEmail,
          errorName: error.name,
          errorMessage: error.message,
          errorStatus: (error as any).status,
        });

        let userMessage = 'Unable to send verification code. Please try again.';

        if (error.message.includes('Signups not allowed')) {
          userMessage = 'New account creation is currently disabled. Please contact support if you need access.';
        } else if (error.message.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          userMessage = 'Too many attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = 'Unable to connect to authentication service. Please check your internet connection.';
        }

        Alert.alert('Authentication Error', userMessage);
        setEmailLoading(false);
        return;
      }

      router.replace(`/auth/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (error: any) {
      logger.error('Auth', 'OTP signin exception', {
        email: maskedEmail,
        error: error?.message || String(error),
        stack: error?.stack,
      });

      const errorMessage = error?.message || 'Something went wrong';
      let userMessage = 'Unable to send verification code. Please try again.';

      if (errorMessage.includes('Not configured')) {
        userMessage = 'Authentication service is not properly configured. Please contact support.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'Unable to connect. Please check your internet connection and try again.';
      }

      Alert.alert('Error', userMessage);
      setEmailLoading(false);
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
          <View style={styles.brandSection}>
            <GradientTitle text="Zenlit" style={styles.brandTitle} />
            <Text style={styles.brandSubtitle}>Connect with people around you</Text>
          </View>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslate }, { scale: cardScale }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSubtitle}>Enter your email to continue</Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={EMAIL_PLACEHOLDER}
                placeholderTextColor="rgba(148, 163, 184, 0.7)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleEmail}
              disabled={!isValidEmail || emailLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                (!isValidEmail || emailLoading) ? styles.disabled : null,
                pressed && isValidEmail && !emailLoading ? styles.primaryButtonPressed : null,
              ]}
            >
              <LinearGradient
                colors={PRIMARY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>
                  {emailLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/terms')}
              style={styles.legalLink}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/privacy')}
              style={styles.legalLink}
            >
              Privacy Policy
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
