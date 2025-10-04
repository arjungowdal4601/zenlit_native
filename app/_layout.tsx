import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';

const RootLayout: React.FC = () => {
  return (
    <SafeAreaProvider>
      <VisibilityProvider>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <StatusBar style="light" backgroundColor={theme.colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          />
        </View>
      </VisibilityProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
