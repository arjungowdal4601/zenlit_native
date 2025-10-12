import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { createShadowStyle } from '../utils/shadow';
import { supabase } from '../lib/supabase';
import {
  validateProfileData,
  checkUsernameAvailability,
  type ProfileData,
  type UsernameCheckResult,
} from '../utils/profileValidation';

const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const GENDERS = ['male', 'female', 'other'] as const;
const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Others' } as const;

const WEB_DATE_INPUT_STYLE: CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: '#ffffff',
  fontSize: 16,
  padding: '14px 16px',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export interface ProfilePresenceFormProps {
  onSuccess?: (profileData: ProfileData) => void;
  onCancel?: () => void;
  initialData?: Partial<ProfileData>;
  submitButtonText?: string;
}

const ProfilePresenceForm: React.FC<ProfilePresenceFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  submitButtonText = 'Create Profile',
}) => {
  const [displayName, setDisplayName] = useState(initialData?.display_name || '');
  const [username, setUsername] = useState(initialData?.user_name || '');
  const [dob, setDob] = useState(initialData?.date_of_birth || '');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [gender, setGender] = useState<typeof GENDERS[number] | ''>(initialData?.gender || '');
  const [isWebDateFocused, setIsWebDateFocused] = useState(false);
  
  // Validation states
  const [displayNameError, setDisplayNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const usernameTimeoutRef = useRef<number | null>(null);

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
    setDobError('');
  };

  const handleDobWebChange = (value: string) => {
    if (!value) {
      setDob('');
      setDobDate(null);
      return;
    }
    const parsed = parseDobString(value);
    if (parsed) {
      updateDob(parsed);
      return;
    }
    const fallback = value.slice(0, 10);
    setDob(fallback);
    setDobDate(null);
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

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      return;
    }

    setIsCheckingUsername(true);
    try {
      const result: UsernameCheckResult = await checkUsernameAvailability(usernameToCheck);
      
      if (!result.isAvailable) {
        setUsernameError('Username is already taken');
        setUsernameSuggestions(result.suggestions || []);
      } else {
        setUsernameError('');
        setUsernameSuggestions([]);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    // Convert to lowercase and allow only valid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9._!@#$%^&*()+=\-\[\]{}|;:,<>?/~`]/g, '');
    setUsername(sanitized);
    setUsernameError('');
    setUsernameSuggestions([]);

    // Clear existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Set new timeout for username checking
    if (sanitized.length >= 3) {
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsername(sanitized);
      }, 500);
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setDisplayNameError('');
  };

  const selectSuggestedUsername = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameError('');
    setUsernameSuggestions([]);
  };

  const isComplete = useMemo(() => {
    return (
      displayName.trim().length > 0 &&
      username.trim().length > 0 &&
      !displayNameError &&
      !usernameError &&
      !dobError &&
      !isCheckingUsername
    );
  }, [displayName, username, displayNameError, usernameError, dobError, isCheckingUsername]);

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) {
      return;
    }

    const profileData: ProfileData = {
      display_name: displayName.trim(),
      user_name: username.trim(),
      date_of_birth: dob || undefined,
      gender: gender || undefined,
    };

    // Validate all data
    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Insert or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: profileData.display_name,
          user_name: profileData.user_name,
          date_of_birth: profileData.date_of_birth,
          gender: profileData.gender,
          email: user.email,
        });

      if (profileError) {
        if (profileError.code === '23505') {
          // Unique constraint violation
          setUsernameError('Username is already taken');
          const result = await checkUsernameAvailability(profileData.user_name);
          setUsernameSuggestions(result.suggestions || []);
          return;
        }
        throw profileError;
      }

      // Success
      onSuccess?.(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Your Presence</Text>
          <Text style={styles.cardSubtitle}>
            Set up your profile to connect with people around you
          </Text>

          {/* Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name *</Text>
            <TextInput
              style={[styles.input, displayNameError ? styles.inputError : null]}
              value={displayName}
              onChangeText={handleDisplayNameChange}
              placeholder="Enter your display name"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              maxLength={50}
            />
            {displayNameError ? (
              <Text style={styles.errorText}>{displayNameError}</Text>
            ) : null}
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username *</Text>
            <TextInput
              style={[styles.input, usernameError ? styles.inputError : null]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Enter your username"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              maxLength={30}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isCheckingUsername && (
              <Text style={styles.helperText}>Checking availability...</Text>
            )}
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
            <Text style={styles.helperText}>
              Only lowercase letters, numbers, dots, underscores, and special characters allowed
            </Text>
            
            {/* Username Suggestions */}
            {usernameSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                <View style={styles.suggestionsRow}>
                  {usernameSuggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={styles.suggestionPill}
                      onPress={() => selectSuggestedUsername(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webDateWrapper}>
                <View
                  style={[
                    styles.pickerField,
                    isWebDateFocused ? styles.pickerFieldFocused : null,
                  ]}
                >
                  <input
                    ref={webDateInputRef}
                    type="date"
                    value={dob}
                    max={formatDate(maxDobDate)}
                    onChange={(e) => handleDobWebChange(e.target.value)}
                    onFocus={() => setIsWebDateFocused(true)}
                    onBlur={() => setIsWebDateFocused(false)}
                    style={WEB_DATE_INPUT_STYLE}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.pickerField,
                  pressed ? styles.pickerFieldPressed : null,
                ]}
                onPress={openDobPicker}
              >
                <View style={styles.pickerRow}>
                  <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
                    {dob || 'Select your date of birth'}
                  </Text>
                  <Feather name="calendar" size={18} color="#94a3b8" style={styles.pickerIcon} />
                </View>
              </Pressable>
            )}
            {dobError ? (
              <Text style={styles.errorText}>{dobError}</Text>
            ) : null}
            <Text style={styles.helperText}>Must be at least 13 years old</Text>
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((genderOption) => (
                <Pressable
                  key={genderOption}
                  style={[
                    styles.genderPill,
                    gender === genderOption ? styles.genderPillActive : null,
                  ]}
                  onPress={() => setGender(genderOption)}
                >
                  <Text
                    style={[
                      styles.genderLabel,
                      gender === genderOption ? styles.genderLabelActive : null,
                    ]}
                  >
                    {GENDER_LABELS[genderOption]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
              !isComplete || isSubmitting ? styles.disabled : null,
            ]}
            onPress={handleSubmit}
            disabled={!isComplete || isSubmitting}
          >
            <LinearGradient
              colors={PRIMARY_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryLabel}>
                {isSubmitting ? 'Creating Profile...' : submitButtonText}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Cancel Button */}
          {onCancel && (
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showIosPicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <Pressable style={styles.iosBackdrop} onPress={closeIosPicker} />
            <View style={styles.iosPickerSheet}>
              <View style={styles.iosPickerToolbar}>
                <Pressable onPress={closeIosPicker}>
                  <Text style={styles.iosPickerAction}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="date"
                value={resolvedDobDate}
                maximumDate={maxDobDate}
                onChange={handleIosDobChange}
                style={styles.iosPicker}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
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
    minHeight: 48,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  pickerField: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 48,
  },
  pickerFieldPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  pickerFieldFocused: {
    borderColor: 'rgba(96, 165, 250, 0.7)',
  },
  webDateWrapper: {},
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerIcon: {
    marginLeft: 12,
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
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ef4444',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  suggestionText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '500',
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
  cancelButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
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

export default ProfilePresenceForm;