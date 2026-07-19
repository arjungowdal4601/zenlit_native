import { StyleSheet } from 'react-native';

import { createShadowStyle } from '../utils/shadow';
import { theme } from './theme';

const prism = theme.prism.colors;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: prism.background,
  },
  root: {
    flex: 1,
    backgroundColor: prism.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 56,
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
    backgroundColor: 'rgba(20, 24, 32, 0.72)',
  },
  brandSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    ...theme.typography.title,
    width: '100%',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0,
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: prism.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 24, 32, 0.82)',
    borderWidth: 1,
    borderColor: prism.border,
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
    color: prism.textSoft,
    marginBottom: 10,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: prism.border,
    backgroundColor: 'rgba(8, 13, 16, 0.86)',
    color: prism.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  pickerField: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: prism.border,
    backgroundColor: 'rgba(8, 13, 16, 0.86)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 48,
  },
  pickerFieldPressed: {
    backgroundColor: 'rgba(20, 24, 32, 0.94)',
  },
  pickerFieldFocused: {
    borderColor: prism.borderStrong,
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
    color: prism.text,
    fontSize: 16,
  },
  dobPlaceholder: {
    color: prism.muted,
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
    borderColor: 'rgba(34, 197, 94, 0.55)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: prism.muted,
  },
  checkingText: {
    marginTop: 6,
    fontSize: 12,
    color: prism.accent,
  },
  successText: {
    marginTop: 6,
    fontSize: 12,
    color: prism.success,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#FCA5A5',
  },
  formError: {
    marginTop: 20,
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: prism.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 13, 16, 0.78)',
  },
  genderPillActive: {
    borderColor: prism.borderStrong,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  genderLabel: {
    fontSize: 14,
    color: prism.textSoft,
    fontWeight: '600',
  },
  genderLabelActive: {
    color: prism.text,
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
    color: prism.text,
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
    backgroundColor: 'rgba(8, 13, 16, 0.70)',
    justifyContent: 'flex-end',
  },
  iosBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  iosPickerSheet: {
    backgroundColor: prism.surface,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: prism.border,
  },
  iosPickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
  },
  iosPickerAction: {
    color: prism.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
    backgroundColor: prism.surface,
  },
});
