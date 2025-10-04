import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';

const RootLayout: React.FC = () => {
  return (
    <SafeAreaProvider>
      <VisibilityProvider>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <View style={styles.container}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.stackContent,
            }}
          />
        </View>
      </VisibilityProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stackContent: {
    backgroundColor: theme.colors.background,
  },
});

export default RootLayout;
