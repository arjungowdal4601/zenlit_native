import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { animations } from '../src/styles/animations';
import { theme } from '../src/styles/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const FADE_DURATION = animations.durations.fadeOut;
const NAVIGATE_DELAY = animations.delays.navigate;

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const useNativeDriver = Platform.OS !== 'web';

  const runButtonScale = useCallback(
    (toValue: number) => {
      Animated.spring(buttonScale, {
        toValue,
        speed: 20,
        bounciness: toValue === 1 ? 8 : 0,
        useNativeDriver,
      }).start();
    },
    [buttonScale, useNativeDriver]
  );

  const handlePressIn = useCallback(() => {
    if (loading) {
      return;
    }

    runButtonScale(0.96);
  }, [loading, runButtonScale]);

  const handlePressOut = useCallback(() => {
    if (loading) {
      return;
    }

    runButtonScale(1);
  }, [loading, runButtonScale]);

  const handlePress = useCallback(() => {
    if (loading) {
      return;
    }

    setLoading(true);
    runButtonScale(1);

    Animated.sequence([
      Animated.delay(NAVIGATE_DELAY),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        router.replace('/radar');
      }
    });
  }, [FADE_DURATION, NAVIGATE_DELAY, containerOpacity, loading, router, runButtonScale, useNativeDriver]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Zenlit</Text>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.icon} size="small" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handlePress}
            >
              <AnimatedLinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cta, { transform: [{ scale: buttonScale }] }]}
              >
                <Text style={styles.ctaLabel}>Get Started</Text>
              </AnimatedLinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -1,
    color: theme.colors.icon,
    marginBottom: theme.spacing.xxl,
  },
  cta: {
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaLabel: {
    color: theme.colors.icon,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.icon,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
