import { StyleSheet } from 'react-native';

import { theme } from '../src/styles/theme';

export const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    color: '#fca5a5',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorMeta: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});
