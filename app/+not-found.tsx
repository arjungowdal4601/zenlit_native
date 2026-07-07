import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import GradientTitle from '../src/components/GradientTitle';
import { theme } from '../src/styles/theme';

const NotFoundScreen: React.FC = () => (
  <View style={styles.root}>
    <GradientTitle text="Zenlit" style={styles.brand} variant="prism" />
    <Text style={styles.title}>Page not found</Text>
    <Text style={styles.body}>This link does not point to a Zenlit page.</Text>
    <Link href="/" asChild>
      <Pressable accessibilityRole="button" style={styles.button}>
        <Text style={styles.buttonText}>Go home</Text>
      </Pressable>
    </Link>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.colors.background,
  },
  brand: {
    marginBottom: 24,
    fontSize: 44,
    lineHeight: 50,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 28,
    minWidth: 132,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default NotFoundScreen;
