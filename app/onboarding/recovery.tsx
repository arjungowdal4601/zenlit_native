import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { supabase } from '../../src/lib/supabase';
import { resolveOnboardingState } from '../../src/services/onboardingService';
import { getPostLogoutRoute, getRouteForOnboardingState, ROUTES } from '../../src/utils/authNavigation';

const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;

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
      await supabase.auth.signOut({ scope: 'global' });
    } finally {
      setIsSigningOut(false);
      router.replace(getPostLogoutRoute());
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.content}>
        <View style={styles.card}>
          <GradientTitle text="Zenlit" style={styles.brandTitle} />
          <Text style={styles.title}>Finish setting up your profile</Text>
          <Text style={styles.body}>
            We found an unfinished setup. Complete your profile basics to continue to Radar.
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
              colors={PRIMARY_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              {isContinuing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
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
                <ActivityIndicator color="#cbd5e1" size="small" />
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
    backgroundColor: '#000000',
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
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 18,
    color: '#fca5a5',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: '#cbd5e1',
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
