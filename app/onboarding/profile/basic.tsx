import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { createShadowStyle } from '../../../src/utils/shadow';
import GradientTitle from '../../../src/components/GradientTitle';


const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const GENDERS = ['Male', 'Female', 'Others'] as const;

const OnboardingBasicScreen: React.FC = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [gender, setGender] = useState<typeof GENDERS[number] | ''>('');

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDobString = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const candidate = new Date(year, month, day);
    if (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month &&
      candidate.getDate() === day
    ) {
      candidate.setHours(0, 0, 0, 0);
      return candidate;
    }
    return null;
  };

  const maxDobDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const resolvedDobDate = useMemo(() => {
    if (dobDate) {
      return dobDate;
    }
    const parsed = parseDobString(dob);
    if (parsed) {
      return parsed;
    }
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 18);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }, [dob, dobDate]);

  const updateDob = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    normalized.setHours(0, 0, 0, 0);
    setDobDate(normalized);
    setDob(formatDate(normalized));
  };

  const handleDobManualChange = (value: string) => {
    const sanitized = value.replace(/[^0-9-]/g, '').slice(0, 10);
    setDob(sanitized);
    const parsed = parseDobString(sanitized);
    setDobDate(parsed);
  };

  const openDobPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: resolvedDobDate,
        maximumDate: maxDobDate,
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            updateDob(selectedDate);
          }
        },
      });
      return;
    }

    if (Platform.OS === 'ios') {
      setShowIosPicker(true);
    }
  };

  const handleIosDobChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      updateDob(selectedDate);
    }
  };

  const closeIosPicker = () => {
    setShowIosPicker(false);
  };

  const isComplete = useMemo(() => {
    return (
      displayName.trim().length > 0 &&
      username.trim().length > 0 &&
      dobDate !== null &&
      gender !== ''
    );
  }, [displayName, username, dobDate, gender]);

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
            <GradientTitle text="Zenlit" style={styles.brandTitle} />
            <Text style={styles.brandSubtitle}>Let's set up your presence</Text>
          </View>

          <View style={styles.card}>
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
              {Platform.OS === 'web' ? (
                <TextInput
                  value={dob}
                  onChangeText={handleDobManualChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(148, 163, 184, 0.7)"
                  keyboardType="numbers-and-punctuation"
                  inputMode="numeric"
                  style={styles.input}
                />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select date of birth"
                  onPress={openDobPicker}
                  style={({ pressed }) => [
                    styles.pickerField,
                    pressed ? styles.pickerFieldPressed : null,
                  ]}
                >
                  <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
                    {dob || 'YYYY-MM-DD'}
                  </Text>
                </Pressable>
              )}
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

        {Platform.OS === 'ios' ? (
          <Modal
            animationType="fade"
            transparent
            visible={showIosPicker}
            onRequestClose={closeIosPicker}
          >
            <View style={styles.iosPickerOverlay}>
              <Pressable style={styles.iosBackdrop} onPress={closeIosPicker} />
              <View style={styles.iosPickerSheet}>
                <View style={styles.iosPickerToolbar}>
                  <Pressable accessibilityRole="button" onPress={closeIosPicker}>
                    <Text style={styles.iosPickerAction}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={resolvedDobDate}
                  onChange={handleIosDobChange}
                  maximumDate={maxDobDate}
                  themeVariant="dark"
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </Modal>
        ) : null}
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
    backgroundColor: 'transparent',
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
  pickerField: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  pickerFieldPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  dobValue: {
    color: '#ffffff',
    fontSize: 16,
  },
  dobPlaceholder: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 16,
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
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  iosBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  iosPickerSheet: {
    backgroundColor: '#0f172a',
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  iosPickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.25)',
  },
  iosPickerAction: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    backgroundColor: 'transparent',
  },
});

export default OnboardingBasicScreen;


