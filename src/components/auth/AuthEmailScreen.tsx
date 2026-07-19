import * as React from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../GradientTitle';
import { Feather } from '../icons';
import { styles } from '../../styles/auth.styles';
import { signInWithEmailOtp } from '../../services/authService';
import { logger } from '../../utils/logger';
import {
  getEmailOtpErrorMessage,
  maskEmail,
  normalizeEmail,
} from '../../utils/authEmail';
import { storePendingOtpEmail } from '../../utils/pendingOtpEmail';
import { prismGradientColors, theme } from '../../styles/theme';

const AuthEmailScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedEmail = normalizeEmail(email);
  const isValidEmail = Boolean(normalizedEmail);

  const handleEmail = async () => {
    if (!normalizedEmail || emailLoading) return;

    const maskedEmail = maskEmail(normalizedEmail);
    setEmailLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await signInWithEmailOtp(normalizedEmail);

      if (error) {
        logger.error('Auth', 'OTP signin failed', {
          email: maskedEmail,
          errorName: error.name,
          errorMessage: error.message,
          errorStatus: (error as any).status,
        });

        setErrorMessage(getEmailOtpErrorMessage(error));
        setEmailLoading(false);
        return;
      }

      if (!storePendingOtpEmail(normalizedEmail)) {
        logger.error('Auth', 'Unable to store pending OTP email');
        setErrorMessage('Unable to continue securely. Please try again.');
        setEmailLoading(false);
        return;
      }

      router.replace('/auth/verify-otp');
    } catch (error: any) {
      logger.error('Auth', 'OTP signin exception', {
        email: maskedEmail,
        error: error?.message || String(error),
        stack: error?.stack,
      });

      setErrorMessage(getEmailOtpErrorMessage(error));
      setEmailLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandSection}>
            <GradientTitle text="Zenlit" style={styles.brandTitle} variant="prism" />
            <Text style={styles.brandSubtitle}>Connect with people around you.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSubtitle}>Enter your email to continue</Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="Enter your email"
                placeholderTextColor={theme.prism.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {errorMessage ? (
              <View
                style={styles.errorNotice}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Feather name="alert-triangle" size={18} color={theme.prism.colors.danger} />
                <Text selectable style={styles.errorNoticeText}>{errorMessage}</Text>
              </View>
            ) : null}

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
                colors={prismGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>
                  {emailLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

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

export default AuthEmailScreen;
