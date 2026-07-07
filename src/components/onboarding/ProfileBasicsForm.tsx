import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientTitle from '../GradientTitle';
import { styles } from '../../styles/profileBasics.styles';
import { prismGradientColors, theme } from '../../styles/theme';
import type { useProfileBasicsOnboarding } from '../../hooks/useProfileBasicsOnboarding';
import { ProfileBasicsDobField } from './ProfileBasicsDobField';
import { ProfileBasicsGenderField } from './ProfileBasicsGenderField';
import { ProfileBasicsUsernameField } from './ProfileBasicsUsernameField';

type ProfileBasicsFormProps = ReturnType<typeof useProfileBasicsOnboarding>;

export const ProfileBasicsLoading = () => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.prism.colors.accent} />
      <Text style={styles.loadingText}>Checking setup...</Text>
    </View>
  </SafeAreaView>
);

export const ProfileBasicsForm = (form: ProfileBasicsFormProps) => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <StatusBar barStyle="light-content" backgroundColor={theme.prism.colors.background} />
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
          <GradientTitle text="Set up your presence" style={styles.brandTitle} variant="prism" />
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
              placeholderTextColor={theme.prism.colors.muted}
              style={styles.input}
            />
            {form.errors.displayName ? <Text style={styles.errorText}>{form.errors.displayName}</Text> : null}
          </View>

          <ProfileBasicsUsernameField
            error={form.errors.username}
            handleSuggestionSelect={form.handleSuggestionSelect}
            handleUsernameChange={form.handleUsernameChange}
            isCheckingUsername={form.isCheckingUsername}
            saveError={form.saveError}
            username={form.username}
            usernameAvailable={form.usernameAvailable}
            usernameSuggestions={form.usernameSuggestions}
          />

          <ProfileBasicsDobField
            closeIosPicker={form.closeIosPicker}
            dob={form.dob}
            error={form.errors.dob}
            handleDobWebChange={form.handleDobWebChange}
            handleIosDobChange={form.handleIosDobChange}
            isWebDateFocused={form.isWebDateFocused}
            maxDobDate={form.maxDobDate}
            maxDobInputValue={form.maxDobInputValue}
            openDobPicker={form.openDobPicker}
            resolvedDobDate={form.resolvedDobDate}
            setIsWebDateFocused={form.setIsWebDateFocused}
            showIosPicker={form.showIosPicker}
            webDateInputRef={form.webDateInputRef}
          />

          <ProfileBasicsGenderField
            error={form.errors.gender}
            gender={form.gender}
            setErrors={form.setErrors}
            setGender={form.setGender}
          />

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
              colors={prismGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              {form.isSubmitting ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color={theme.prism.colors.text} size="small" />
                  <Text style={[styles.primaryLabel, styles.buttonLoadingText]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.primaryLabel}>Continue</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
