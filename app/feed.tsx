import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import AppHeader from '../src/components/AppHeader';
import FeedList from '../src/components/FeedList';
import Navigation from '../src/components/Navigation';

const FeedScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
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
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
});

export default FeedScreen;
