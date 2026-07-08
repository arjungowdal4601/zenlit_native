import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import GradientTitle from '../src/components/GradientTitle';
import { persistHasSeenGetStarted } from '../src/utils/getStartedPreference';
import { styles } from '../src/styles/getStarted.styles';
import { prismGradientColors } from '../src/styles/theme';

const GetStartedScreen: React.FC = () => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    persistHasSeenGetStarted();
    router.replace('/auth');
  }, [router]);

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          <GradientTitle text="Zenlit" style={styles.title} numberOfLines={1} variant="prism" />
          <Text style={styles.subtitle}>Connect with people around you.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handlePress}
          style={({ pressed }) => [styles.buttonWrapper, pressed ? styles.buttonPressed : null]}
        >
          <LinearGradient
            colors={prismGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Get Started</Text>
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
      </View>
    </View>
  );
};

export default GetStartedScreen;








