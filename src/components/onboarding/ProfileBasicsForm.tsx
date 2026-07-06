import type { CSSProperties } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientTitle from '../GradientTitle';
import UsernameSuggestions from '../UsernameSuggestions';
import { styles } from '../../styles/profileBasics.styles';
import { GENDERS, type useProfileBasicsOnboarding } from '../../hooks/useProfileBasicsOnboarding';
import { USERNAME_HELPER_TEXT } from '../../utils/profileValidation';

const PRIMARY_GRADIENT = ['#2563eb', '#7e22ce'] as const;
const WEB_DATE_INPUT_OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  borderRadius: 16,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
};

type ProfileBasicsFormProps = ReturnType<typeof useProfileBasicsOnboarding>;

export const ProfileBasicsLoading = () => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <StatusBar barStyle="light-content" backgroundColor="#000000" />
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#60a5fa" />
      <Text style={styles.loadingText}>Checking setup...</Text>
    </View>
  </SafeAreaView>
);

export const ProfileBasicsForm = (form: ProfileBasicsFormProps) => (
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
        <View style={styles.brandSection}>
          <Text style={styles.brandSubtitle}>Step 1 of 2</Text>
          <GradientTitle text="Set up your presence" style={styles.brandTitle} />
          <Text style={styles.onboardingSubtitle}>
            These basics unlock Radar and help nearby people recognize the real you.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              value={form.displayName}
              onChangeText={(value) => {
                form.setDisplayName(value);
                if (form.errors.displayName) {
                  form.setErrors((next) => ({ ...next, displayName: '' }));
                }
              }}
              placeholder="How should we call you?"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              style={styles.input}
            />
            {form.errors.displayName ? <Text style={styles.errorText}>{form.errors.displayName}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.usernameInputWrapper}>
              <TextInput
                value={form.username}
                onChangeText={form.handleUsernameChange}
                placeholder="username"
                placeholderTextColor="rgba(148, 163, 184, 0.7)"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  form.usernameAvailable === true && !form.saveError && styles.inputSuccess,
                  form.usernameAvailable === false && styles.inputError,
                ]}
              />
              {form.isCheckingUsername ? (
                <View style={styles.usernameStatusIcon}>
                  <Feather name="loader" size={18} color="#60a5fa" />
                </View>
              ) : null}
              {!form.isCheckingUsername && form.usernameAvailable === true && !form.saveError ? (
                <View style={styles.usernameStatusIcon}>
                  <Feather name="check-circle" size={18} color="#10b981" />
                </View>
              ) : null}
              {!form.isCheckingUsername && form.usernameAvailable === false ? (
                <View style={styles.usernameStatusIcon}>
                  <Feather name="x-circle" size={18} color="#ef4444" />
                </View>
              ) : null}
            </View>
            {!form.isCheckingUsername && form.usernameAvailable !== false ? (
              <Text style={styles.helperText}>{USERNAME_HELPER_TEXT}</Text>
            ) : null}
            {form.isCheckingUsername ? <Text style={styles.checkingText}>Checking availability...</Text> : null}
            {!form.isCheckingUsername && form.usernameAvailable === true && !form.saveError ? (
              <Text style={styles.successText}>Username is available!</Text>
            ) : null}
            {!form.isCheckingUsername && form.usernameAvailable === false ? (
              <Text style={styles.errorText}>That username is already taken. Try one of these:</Text>
            ) : null}
            {form.errors.username && !form.isCheckingUsername && form.usernameAvailable !== false ? (
              <Text style={styles.errorText}>{form.errors.username}</Text>
            ) : null}
            {!form.isCheckingUsername && form.usernameAvailable === false && form.usernameSuggestions.length > 0 ? (
              <UsernameSuggestions
                suggestions={form.usernameSuggestions}
                onSelectSuggestion={form.handleSuggestionSelect}
              />
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select date of birth"
                onPress={() => {
                  const element = form.webDateInputRef.current;
                  if (!element) return;
                  const anyElement = element as unknown as { showPicker?: () => void; focus: () => void };
                  try {
                    if (typeof anyElement.showPicker === 'function') anyElement.showPicker();
                    else element.focus();
                  } catch {
                    element.focus();
                  }
                }}
                style={({ pressed }) => [
                  styles.pickerField,
                  form.isWebDateFocused ? styles.pickerFieldFocused : null,
                  pressed ? styles.pickerFieldPressed : null,
                ]}
              >
                <View style={styles.pickerRow}>
                  <Text style={form.dob ? styles.dobValue : styles.dobPlaceholder}>
                    {form.dob || 'YYYY-MM-DD'}
                  </Text>
                  <Feather name="calendar" size={24} color="#ffffff" style={styles.pickerIcon} />
                </View>
                <input
                  ref={form.webDateInputRef}
                  type="date"
                  value={form.dob}
                  onChange={(event) => form.handleDobWebChange(event.target.value)}
                  max={form.maxDobInputValue}
                  style={WEB_DATE_INPUT_OVERLAY_STYLE}
                  onFocus={() => form.setIsWebDateFocused(true)}
                  onBlur={() => form.setIsWebDateFocused(false)}
                  aria-label="Date of Birth"
                />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select date of birth"
                onPress={form.openDobPicker}
                style={({ pressed }) => [
                  styles.pickerField,
                  pressed ? styles.pickerFieldPressed : null,
                ]}
              >
                <View style={styles.pickerRow}>
                  <Text style={form.dob ? styles.dobValue : styles.dobPlaceholder}>
                    {form.dob || 'YYYY-MM-DD'}
                  </Text>
                  <Feather name="calendar" size={24} color="#ffffff" style={styles.pickerIcon} />
                </View>
              </Pressable>
            )}
            {form.errors.dob ? <Text style={styles.errorText}>{form.errors.dob}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((option) => {
                const isSelected = option === form.gender;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => {
                      form.setGender(option);
                      if (form.errors.gender) form.setErrors((next) => ({ ...next, gender: '' }));
                    }}
                    style={[styles.genderPill, isSelected ? styles.genderPillActive : null]}
                  >
                    <Text style={[styles.genderLabel, isSelected ? styles.genderLabelActive : null]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {form.errors.gender ? <Text style={styles.errorText}>{form.errors.gender}</Text> : null}
          </View>

          {form.saveError ? <Text style={styles.formError}>{form.saveError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={form.isSubmitting}
            onPress={form.handleContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              (!form.isFilled || form.isSubmitting) ? styles.disabled : null,
              pressed && !form.isSubmitting ? styles.primaryButtonPressed : null,
            ]}
          >
            <LinearGradient
              colors={PRIMARY_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              {form.isSubmitting ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={[styles.primaryLabel, styles.buttonLoadingText]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.primaryLabel}>Continue</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {Platform.OS === 'ios' ? (
        <Modal animationType="fade" transparent visible={form.showIosPicker} onRequestClose={form.closeIosPicker}>
          <View style={styles.iosPickerOverlay}>
            <Pressable style={styles.iosBackdrop} onPress={form.closeIosPicker} />
            <View style={styles.iosPickerSheet}>
              <View style={styles.iosPickerToolbar}>
                <Pressable accessibilityRole="button" onPress={form.closeIosPicker}>
                  <Text style={styles.iosPickerAction}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={form.resolvedDobDate}
                onChange={form.handleIosDobChange}
                maximumDate={form.maxDobDate}
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
