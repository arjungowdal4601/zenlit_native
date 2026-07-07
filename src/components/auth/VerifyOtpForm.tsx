import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import GradientTitle from '../GradientTitle';
import { styles } from '../../styles/verifyOtp.styles';
import { prismGradientColors, theme } from '../../styles/theme';
import type { VerifyOtpViewModel } from '../../hooks/useVerifyOtp';

type VerifyOtpFormProps = Omit<VerifyOtpViewModel, 'email'> & {
  email: string;
};

const VerifyOtpForm = ({
  code,
  cooldown,
  email,
  error,
  handleBack,
  handleCodeChange,
  handleResend,
  handleVerify,
  isComplete,
  resending,
  status,
  verifying,
}: VerifyOtpFormProps) => (
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
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color={theme.prism.colors.text} />
          </Pressable>
        </View>

        <View style={styles.brandSection}>
          <GradientTitle text="Zenlit" style={styles.brandTitle} variant="prism" />
          <Text style={styles.brandSubtitle}>Verify your identity</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Feather name="mail" size={18} color={theme.prism.colors.accent} />
            <Text style={styles.infoText}>
              Code sent to <Text style={styles.infoTextStrong}>{email}</Text>
            </Text>
          </View>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}
          {error ? (
            <Text style={[styles.errorText, status ? styles.errorWithStatus : null]}>{error}</Text>
          ) : null}

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Enter 6-digit code</Text>
            <View style={styles.otpWrapper}>
              <TextInput
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                inputMode="numeric"
                maxLength={6}
                accessibilityLabel="OTP code"
                autoFocus
                style={styles.otpInput}
              />
              {code.length === 0 ? <Text style={styles.ghostCode}>000000</Text> : null}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!isComplete || verifying}
            onPress={handleVerify}
            style={({ pressed }) => [
              styles.primaryButton,
              (!isComplete || verifying) ? styles.disabled : null,
              pressed && isComplete && !verifying ? styles.primaryButtonPressed : null,
            ]}
          >
            <LinearGradient
              colors={prismGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryLabel}>
                {verifying ? 'Verifying...' : 'Verify & Continue'}
              </Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.resendBlock}>
            {cooldown > 0 ? (
              <Text style={styles.cooldownText}>
                Resend code in <Text style={styles.cooldownStrong}>{cooldown}s</Text>
              </Text>
            ) : (
              <Pressable accessibilityRole="button" onPress={handleResend}>
                <Text style={styles.resendLink}>
                  {resending ? 'Sending...' : 'Resend code'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

export default VerifyOtpForm;
