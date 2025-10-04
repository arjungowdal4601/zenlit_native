import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { createShadowStyle } from '../../src/utils/shadow';

const TITLE_GRADIENT = ['#2563eb', '#4f46e5', '#7e22ce'] as const;
const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const CARD_ELEVATION = createShadowStyle({
  native: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
  },
  web: '0 18px 24px rgba(0, 0, 0, 0.35)',
});

const GOOGLE_BUTTON_ELEVATION = createShadowStyle({
  native: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  web: '0 8px 16px rgba(15, 23, 42, 0.25)',
});

type GradientTextProps = {
  children: string;
};

const GradientText: React.FC<GradientTextProps> = ({ children }) => {
  return (
    <MaskedView maskElement={<Text style={[styles.brandTitle, styles.brandMask]}>{children}</Text>}>
      <LinearGradient colors={TITLE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={[styles.brandTitle, styles.brandTransparent]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const SignInScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleGoogle = () => {
    if (googleLoading) {
      return;
    }
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      router.replace('/feed');
    }, 450);
  };

  const handleEmail = () => {
    if (!isValidEmail || emailLoading) {
      return;
    }
    setEmailLoading(true);
    setTimeout(() => {
      setEmailLoading(false);
      router.push(`/auth/verify-otp-signin?email=${encodeURIComponent(email.trim())}`);
    }, 350);
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
            <GradientText>Zenlit</GradientText>
            <Text style={styles.brandSubtitle}>Connect with people around you</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <Pressable
              accessibilityRole="button"
              onPress={handleGoogle}
              style={({ pressed }) => [
                styles.googleButton,
                pressed ? styles.googleButtonPressed : null,
                googleLoading ? styles.disabled : null,
              ]}
            >
              <FontAwesome name="google" size={22} color="#EA4335" />
              <Text style={styles.googleLabel}>
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
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
                  {emailLoading ? 'Sending...' : 'Send Login Code'}
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                onPress={() => router.push('/auth/signup')}
                style={styles.footerLink}
              >
                Sign Up
              </Text>
            </Text>
          </View>

          <Text style={styles.legalText}>
            By continuing, you agree to our <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  brandMask: {
    color: '#ffffff',
  },
  brandTransparent: {
    color: 'transparent',
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#94a3b8',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    ...CARD_ELEVATION,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...GOOGLE_BUTTON_ELEVATION,
  },
  googleButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  googleLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    marginVertical: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.35)',
  },
  dividerLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputBlock: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5f5',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 18,
    marginTop: 24,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  footerText: {
    marginTop: 28,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerLink: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  legalText: {
    marginTop: 36,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#60a5fa',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;




