import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { VisibilityProvider } from './src/context/VisibilityContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { COLORS } from './src/theme/colors';

const AppTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.background,
    primary: COLORS.icon,
    text: COLORS.icon,
    border: COLORS.tabBorder,
  },
};

const App: React.FC = () => {
  const [showTabs, setShowTabs] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const tabOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showTabs && showWelcome) {
      tabOpacity.setValue(0);
      Animated.timing(tabOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setShowWelcome(false));
    }
  }, [showTabs, showWelcome, tabOpacity]);

  const handleWelcomeComplete = useCallback(() => {
    if (!showTabs) {
      setShowTabs(true);
    }
  }, [showTabs]);

  const pointerEventsValue: 'none' | 'auto' = showWelcome ? 'none' : 'auto';
  const pointerEventsProps = Platform.OS === 'web' ? {} : { pointerEvents: pointerEventsValue };

  return (
    <SafeAreaProvider>
      <View style={styles.appRoot}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        {showTabs && (
          <Animated.View
            {...pointerEventsProps}
            style={[
              styles.navigatorContainer,
              Platform.OS === 'web' && showWelcome ? styles.navigatorPointerNone : null,
              { opacity: tabOpacity },
            ]}
          >
            <VisibilityProvider>
              <NavigationContainer theme={AppTheme}>
                <AppNavigator />
              </NavigationContainer>
            </VisibilityProvider>
          </Animated.View>
        )}
        {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navigatorContainer: {
    flex: 1,
  },
  navigatorPointerNone: {
    pointerEvents: 'none',
  },
});

export default App;


