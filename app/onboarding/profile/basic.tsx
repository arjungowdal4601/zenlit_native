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
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { createShadowStyle } from '../../../src/utils/shadow';


const TITLE_GRADIENT = ['#2563eb', '#4f46e5', '#7e22ce'] as const;
const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const GENDERS = ['Male', 'Female', 'Others'] as const;

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

const OnboardingBasicScreen: React.FC = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<typeof GENDERS[number] | ''>('');

  const isComplete = useMemo(() => {
    return displayName.trim().length > 0 && username.trim().length > 0 && dob.trim().length > 0 && gender !== '';
  }, [displayName, username, dob, gender]);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();
    setUsername(sanitized);
  };

  const handleContinue = () => {
    if (!isComplete) {
      return;
    }
    router.push('/onboarding/profile/complete');
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
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <GradientText>Zenlit</GradientText>
            <Text style={styles.brandSubtitle}>Let's set up your presence</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.screenTitle}>Tell me about yourself</Text>
            <Text style={styles.screenSubtitle}>We use this info to help others recognize you.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor="rgba(148, 163, 184, 0.7)"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="username"
                placeholderTextColor="rgba(148, 163, 184, 0.7)"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <Text style={styles.helperText}>Only lowercase letters, numbers, dots, and underscores.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(148, 163, 184, 0.7)"
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((option) => {
                  const isSelected = option === gender;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => setGender(option)}
                      style={[styles.genderPill, isSelected ? styles.genderPillActive : null]}
                    >
                      <Text style={[styles.genderLabel, isSelected ? styles.genderLabelActive : null]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!isComplete}
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.primaryButton,
                !isComplete ? styles.disabled : null,
                pressed && isComplete ? styles.primaryButtonPressed : null,
              ]}
            >
              <LinearGradient
                colors={PRIMARY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </View>
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
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    maxWidth: 380,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    ...createShadowStyle({
      native: {
        shadowColor: '#000000',
        shadowOpacity: 0.55,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 18 },
        elevation: 22,
      },
    }),
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  screenSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
  fieldGroup: {
    marginTop: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5f5',
    marginBottom: 10,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  genderPillActive: {
    borderColor: 'rgba(96, 165, 250, 0.7)',
    backgroundColor: 'rgba(30, 64, 175, 0.35)',
  },
  genderLabel: {
    fontSize: 14,
    color: '#cbd5f5',
    fontWeight: '600',
  },
  genderLabelActive: {
    color: '#ffffff',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 32,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default OnboardingBasicScreen;


