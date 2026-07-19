import { StyleSheet } from 'react-native';

import { createShadowStyle } from '../utils/shadow';
import { theme } from './theme';

const prism = theme.prism.colors;

const CARD_ELEVATION = createShadowStyle({
  native: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
  },
  web: '0 18px 24px rgba(0, 0, 0, 0.35)',
});

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
    paddingTop: 24,
    paddingBottom: 56,
    alignItems: 'center',
  },
  brandSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    ...theme.typography.display,
    width: '100%',
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: prism.textSoft,
    letterSpacing: 0,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 24, 32, 0.82)',
    borderWidth: 1,
    borderColor: prism.border,
    ...CARD_ELEVATION,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: prism.text,
    marginBottom: 8,
    letterSpacing: 0,
  },
  cardSubtitle: {
    fontSize: 15,
    color: prism.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputBlock: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: prism.textSoft,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: prism.border,
    backgroundColor: 'rgba(8, 13, 16, 0.86)',
    color: prism.text,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  errorNotice: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.42)',
    backgroundColor: 'rgba(127, 29, 29, 0.24)',
  },
  errorNoticeText: {
    flex: 1,
    color: '#FECACA',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  primaryLabel: {
    color: prism.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  legalText: {
    marginTop: 32,
    fontSize: 12,
    color: prism.mutedDeep,
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
    maxWidth: 300,
  },
  legalLink: {
    color: prism.accent,
    textDecorationLine: 'underline',
  },
});
