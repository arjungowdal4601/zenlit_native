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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import GradientText from '../components/GradientText';
import { COLORS, GRADIENT_COLORS, GRADIENT_END, GRADIENT_START } from '../theme/colors';

type WelcomeScreenProps = {
  onComplete: () => void;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const useNativeDriver = Platform.OS !== 'web';
  const [loading, setLoading] = useState(false);
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (loading) {
      return;
    }

    Animated.spring(buttonScale, {
      toValue: 0.96,
      speed: 20,
      bounciness: 0,
      useNativeDriver,
    }).start();
  }, [buttonScale, loading]);

  const handlePressOut = useCallback(() => {
    if (loading) {
      return;
    }

    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver,
    }).start();
  }, [buttonScale, loading]);

  const handlePress = useCallback(() => {
    if (loading) {
      return;
    }

    setLoading(true);

    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver,
    }).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }, [buttonScale, containerOpacity, loading, onComplete]);

  return (
    <Animated.View style={[styles.welcomeContainer, { opacity: containerOpacity }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.titleWrapper}>
            <GradientText textStyle={styles.title} gradientStyle={styles.titleGradientPadding}>
              Zenlit
            </GradientText>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.icon} size="small" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handlePress}
              disabled={loading}
            >
              <AnimatedLinearGradient
                colors={GRADIENT_COLORS}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={[styles.buttonGradient, { transform: [{ scale: buttonScale }] }]}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </AnimatedLinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleWrapper: {
    marginBottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 64,
    textAlign: 'center',
  },
  titleGradientPadding: {
    paddingHorizontal: 8,
  },
  buttonGradient: {
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.buttonShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.icon,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 12,
    color: COLORS.icon,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeScreen;


