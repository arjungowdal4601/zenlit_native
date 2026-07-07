import { StyleSheet } from 'react-native';

import { createShadowStyle } from '../utils/shadow';
import { theme } from './theme';

const BUTTON_ELEVATION = createShadowStyle({
  native: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  web: '0 12px 16px rgba(0, 0, 0, 0.35)',
});

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.prism.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 52,
  },
  title: {
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    color: theme.prism.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: theme.prism.colors.muted,
    textAlign: 'center',
    letterSpacing: 0,
  },
  buttonWrapper: {
    width: '70%',
    maxWidth: 260,
    minWidth: 200,
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    ...BUTTON_ELEVATION,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: theme.prism.colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  footerLinks: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLink: {
    color: theme.prism.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  footerDot: {
    color: '#475569',
    fontSize: 13,
  },
});
