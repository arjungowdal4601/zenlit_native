import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { signOut } from '../../src/services/authService';
import { resolveOnboardingState } from '../../src/services/onboardingService';
import { getRouteForOnboardingState, ROUTES } from '../../src/utils/onboardingState';
import { prismGradientColors, theme } from '../../src/styles/theme';

const OnboardingRecoveryScreen: React.FC = () => {
  const router = useRouter();
  const [isContinuing, setIsContinuing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (isContinuing || isSigningOut) {
      return;
    }

    setIsContinuing(true);
    setError('');

    try {
      const state = await resolveOnboardingState();
      if (state.status === 'recovery' && state.missingFields.length > 0) {
        router.replace(ROUTES.onboardingBasic);
        return;
      }

      router.replace(getRouteForOnboardingState(state));
    } catch {
      setError('We could not check your setup right now. Please try again or sign out.');
    } finally {
      setIsContinuing(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut || isContinuing) {
      return;
    }

    setIsSigningOut(true);
    setError('');

    try {
      await signOut('global');
    } finally {
      setIsSigningOut(false);
      router.replace(ROUTES.auth);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
      <View style={styles.content}>
        <View style={styles.card}>
          <GradientTitle text="Zenlit" style={styles.brandTitle} variant="prism" />
          <Text style={styles.title}>We could not confirm your setup</Text>
          <Text style={styles.body}>
            Continue to check your account and fix anything missing, or sign out and try again.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isContinuing || isSigningOut}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !isContinuing && !isSigningOut ? styles.pressed : null,
              isContinuing || isSigningOut ? styles.disabled : null,
            ]}
          >
            <LinearGradient
              colors={prismGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              {isContinuing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={theme.prism.colors.text} size="small" />
                  <Text style={[styles.primaryLabel, styles.loadingLabel]}>Checking...</Text>
                </View>
              ) : (
                <Text style={styles.primaryLabel}>Continue setup</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isContinuing || isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && !isContinuing && !isSigningOut ? styles.pressed : null,
              isContinuing || isSigningOut ? styles.disabled : null,
            ]}
          >
            {isSigningOut ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.prism.colors.textSoft} size="small" />
                <Text style={[styles.secondaryLabel, styles.loadingLabel]}>Signing out...</Text>
              </View>
            ) : (
              <Text style={styles.secondaryLabel}>Sign out</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.prism.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(20, 24, 32, 0.82)',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  brandTitle: {
    ...theme.typography.title,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.prism.colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    marginTop: 12,
    color: theme.prism.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 18,
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 28,
    minHeight: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: theme.prism.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.prism.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: theme.prism.colors.textSoft,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLabel: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});

export default OnboardingRecoveryScreen;
