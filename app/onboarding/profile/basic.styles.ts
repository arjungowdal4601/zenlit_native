import { StyleSheet } from 'react-native';

import { createShadowStyle } from '../../../src/utils/shadow';
import { theme } from '../../../src/styles/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 16,
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
    maxWidth: 400,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    ...theme.typography.title,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
  },
  onboardingSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
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
    minHeight: 48,
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
  usernameInputWrapper: {
    position: 'relative',
  },
  usernameStatusIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  inputSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  checkingText: {
    marginTop: 6,
    fontSize: 12,
    color: '#60a5fa',
  },
  successText: {
    marginTop: 6,
    fontSize: 12,
    color: '#10b981',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#fca5a5',
  },
  formError: {
    marginTop: 20,
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoadingText: {
    marginLeft: 8,
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
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  iosPickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  iosPickerAction: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
    backgroundColor: '#0f172a',
  },
});
