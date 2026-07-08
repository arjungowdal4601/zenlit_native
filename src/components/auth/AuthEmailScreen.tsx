import * as React from 'react';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../GradientTitle';
import { styles } from '../../styles/auth.styles';
import { signInWithEmailOtp } from '../../services/authService';
import { logger } from '../../utils/logger';
import {
  getEmailOtpErrorMessage,
  maskEmail,
  normalizeEmail,
} from '../../utils/authEmail';
import { prismGradientColors, theme } from '../../styles/theme';

const AuthEmailScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const normalizedEmail = normalizeEmail(email);
  const isValidEmail = Boolean(normalizedEmail);

  const handleEmail = async () => {
    if (!normalizedEmail || emailLoading) return;

    const maskedEmail = maskEmail(normalizedEmail);
    setEmailLoading(true);

    try {
      const { error } = await signInWithEmailOtp(normalizedEmail);

      if (error) {
        logger.error('Auth', 'OTP signin failed', {
          email: maskedEmail,
          errorName: error.name,
          errorMessage: error.message,
          errorStatus: (error as any).status,
        });

        Alert.alert('Authentication Error', getEmailOtpErrorMessage(error));
        setEmailLoading(false);
        return;
      }

      router.replace({
        pathname: '/auth/verify-otp',
        params: { email: normalizedEmail },
      });
    } catch (error: any) {
      logger.error('Auth', 'OTP signin exception', {
        email: maskedEmail,
        error: error?.message || String(error),
        stack: error?.stack,
      });

      Alert.alert('Error', getEmailOtpErrorMessage(error));
      setEmailLoading(false);
    }
  };

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
          <View style={styles.brandSection}>
            <GradientTitle text="Zenlit" style={styles.brandTitle} variant="prism" />
            <Text style={styles.brandSubtitle}>Connect with people around you</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSubtitle}>Enter your email to continue</Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.prism.colors.muted}
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
