import '../src/utils/applyWebShadowPatch';

import React, { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VisibilityProvider } from '../src/contexts/VisibilityContext';
import { theme } from '../src/styles/theme';

const RootLayout: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
      });
    }
  }, [pathname]);

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
