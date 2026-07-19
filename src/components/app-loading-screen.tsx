import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '../styles/theme';

const LOADING_TITLE = 'Getting things ready…';
const LOADING_MESSAGE = 'We’ll take you to your page as soon as everything is ready.';

export const AppLoadingScreen: React.FC = () => (
  <View style={styles.root}>
    <View
      accessible
      accessibilityLabel={`${LOADING_TITLE} ${LOADING_MESSAGE}`}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={styles.content}
    >
      <View style={styles.indicatorShell}>
        <ActivityIndicator
          accessible={false}
          color={theme.prism.colors.accent}
          size="large"
        />
      </View>
      <Text accessible={false} style={styles.title}>
        {LOADING_TITLE}
      </Text>
      <Text accessible={false} style={styles.message}>
        {LOADING_MESSAGE}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: theme.prism.colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  indicatorShell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  title: {
    paddingTop: 20,
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  message: {
    paddingTop: 8,
    color: theme.prism.colors.muted,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
