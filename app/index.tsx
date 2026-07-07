import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import GradientTitle from '../src/components/GradientTitle';
import { persistHasSeenGetStarted } from '../src/utils/getStartedPreference';
import { styles } from '../src/styles/getStarted.styles';
import { prismGradientColors, theme } from '../src/styles/theme';

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

export default GetStartedScreen;








