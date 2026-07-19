import { StyleSheet } from 'react-native';

import { theme } from './theme';

export const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: theme.prism.colors.background,
  },
  routeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.prism.colors.background,
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
