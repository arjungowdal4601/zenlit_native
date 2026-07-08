import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../../src/components/GradientTitle';
import { signOut } from '../../src/services/authService';
import { resolveOnboardingState } from '../../src/services/onboardingService';
import { styles } from '../../src/styles/onboardingRecovery.styles';
import { prismGradientColors, theme } from '../../src/styles/theme';
import { getRouteForOnboardingState } from '../../src/utils/onboardingState';

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
      if (state.status === 'recovery') {
        setError('We still could not confirm your setup. Please try again or sign out.');
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

export default OnboardingRecoveryScreen;
