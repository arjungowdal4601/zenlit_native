import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AppHeader from '../src/components/AppHeader';
import FeedList from '../src/components/FeedList';
import Navigation from '../src/components/Navigation';
import { theme } from '../src/styles/theme';

const FeedScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={theme.gradients.background.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      />
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <AppHeader title="Feed" />
      <View style={styles.content}>
        <FeedList />
      </View>
      <Navigation activePath="/feed" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});

export default FeedScreen;
