import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../src/components/AppHeader';
import FeedList from '../src/components/FeedList';
import Navigation from '../src/components/Navigation';

const FeedScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader title="Feed" />
      </SafeAreaView>
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
    backgroundColor: '#000000',
  },
  safeArea: {
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
});

export default FeedScreen;
