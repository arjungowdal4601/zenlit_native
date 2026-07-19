import { StyleSheet } from 'react-native';

import { theme } from './theme';

const prism = theme.prism.colors;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: prism.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: prism.border,
    backgroundColor: 'rgba(20, 24, 32, 0.82)',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  brandTitle: {
    ...theme.typography.title,
    width: '100%',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    color: prism.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    marginTop: 12,
    color: prism.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 18,
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 28,
    minHeight: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: prism.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: prism.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: prism.textSoft,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLabel: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
