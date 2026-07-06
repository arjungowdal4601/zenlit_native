import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';

import { createShadowStyle } from '../src/utils/shadow';
import GradientTitle from '../src/components/GradientTitle';
import { persistHasSeenGetStarted } from '../src/utils/getStartedPreference';
import { prismGradientColors, theme } from '../src/styles/theme';

const BUTTON_ELEVATION = createShadowStyle({
  native: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  web: '0 12px 16px rgba(0, 0, 0, 0.35)',
});

const GetStartedScreen: React.FC = () => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const containerScale = useRef(new Animated.Value(1)).current;
  const containerTranslate = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    containerScale.setValue(1);
    containerTranslate.setValue(0);
    containerOpacity.setValue(1);
  }, [containerOpacity, containerScale, containerTranslate]);

  const runContainerAnimation = useCallback((isPressed: boolean) => {
    Animated.parallel([
      Animated.timing(containerScale, {
        toValue: isPressed ? 0.95 : 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(containerOpacity, {
        toValue: isPressed ? 0.8 : 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(containerTranslate, {
        toValue: isPressed ? -12 : 0,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [containerOpacity, containerScale, containerTranslate]);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
      containerScale.setValue(1);
      containerTranslate.setValue(0);
      containerOpacity.setValue(1);
    }, [containerOpacity, containerScale, containerTranslate])
  );

  const handlePress = useCallback(() => {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);
    runContainerAnimation(true);
    void persistHasSeenGetStarted();

    setTimeout(() => {
      router.replace('/auth');
    }, 300);
  }, [isNavigating, router, runContainerAnimation]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }, { translateY: containerTranslate }],
          },
        ]}
      >
        <View style={styles.titleWrapper}>
          <GradientTitle text="Zenlit" style={styles.title} numberOfLines={1} variant="prism" />
          <Text style={styles.subtitle}>Connect with people around you.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isNavigating}
          onPress={handlePress}
          style={({ pressed }) => [styles.buttonWrapper, pressed ? styles.buttonPressed : null]}
        >
          <LinearGradient
            colors={prismGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {isNavigating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.prism.colors.text} size="small" />
                <Text style={[styles.buttonLabel, styles.loadingText]}>Loading...</Text>
              </View>
            ) : (
              <Text style={styles.buttonLabel}>Get Started</Text>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.footerLinks}>
          <Text onPress={() => router.push('/terms')} style={styles.footerLink}>
            Terms
          </Text>
          <Text style={styles.footerDot}>•</Text>
          <Text onPress={() => router.push('/privacy')} style={styles.footerLink}>
            Privacy
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.prism.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 52,
  },
  title: {
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    color: theme.prism.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: theme.prism.colors.muted,
    textAlign: 'center',
    letterSpacing: 0,
  },
  buttonWrapper: {
    width: '70%',
    maxWidth: 260,
    minWidth: 200,
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    ...BUTTON_ELEVATION,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: theme.prism.colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  footerLinks: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLink: {
    color: theme.prism.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  footerDot: {
    color: '#475569',
    fontSize: 13,
  },
});

export default GetStartedScreen;








