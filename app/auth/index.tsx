import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { createShadowStyle } from '../../src/utils/shadow';
import GradientTitle from '../../src/components/GradientTitle';
import { supabase } from '../../src/lib/supabase';
import {
  IOS_CLIENT_ID,
  ANDROID_CLIENT_ID,
  WEB_CLIENT_ID,
  GOOGLE_OAUTH_SCOPES,
  EXPO_REDIRECT_SCHEME,
} from '../../src/constants/googleOAuth';

WebBrowser.maybeCompleteAuthSession();

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

const GOOGLE_G_LOGO = 'https://developers.google.com/identity/images/g-logo.png';
const EMAIL_PLACEHOLDER = 'Enter your email';

const AuthScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Avoid invalid_request in dev builds by using native client IDs on native platforms
  // and web client only for web. Do not pass a custom redirectUri on native.
  const googleConfig = Platform.OS === 'web'
    ? {
        clientId: WEB_CLIENT_ID,
        responseType: 'id_token' as const,
        scopes: [...GOOGLE_OAUTH_SCOPES],
      }
    : {
        iosClientId: IOS_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID,
        responseType: 'id_token' as const,
        scopes: [...GOOGLE_OAUTH_SCOPES],
      };

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig as any);

  const handleGoogle = async () => {
    if (googleLoading || !request) {
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken =
          (result as any).params?.id_token || result.authentication?.idToken;
        if (!idToken) throw new Error('No id_token returned from Google');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: request.nonce,
        });
        if (error) {
          throw error;
        }
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In failed', e?.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!isValidEmail || emailLoading) {
      return;
    }
    setEmailLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
        setEmailLoading(false);
        return;
      }

      router.push(`/auth/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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

            <Pressable
              accessibilityRole="button"
              onPress={handleGoogle}
              style={({ pressed }) => [
                styles.googleButton,
                pressed ? styles.googleButtonPressed : null,
                (googleLoading || !request) ? styles.disabled : null,
              ]}
            >
              <Image
                source={{ uri: GOOGLE_G_LOGO }}
                style={styles.googleIcon}
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.googleLabel}>
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

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
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 2,
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

export default AuthScreen;
