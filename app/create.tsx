import React from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';

import AppHeader from '../src/components/AppHeader';
import EditablePost from '../src/components/EditablePost';
import Navigation from '../src/components/Navigation';
import { FEED_DATA } from '../src/constants/feedData';

const DEFAULT_AUTHOR = FEED_DATA[0]?.author ?? {
  name: 'Zenlit Member',
  username: 'zenlit',
};

const CreateScreen: React.FC = () => {
  const handleShare = (content: string) => {
    Alert.alert('Post shared', content);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Create Post" />

      <View style={styles.content}>
        <EditablePost author={DEFAULT_AUTHOR} onSubmit={handleShare} />
      </View>

      <Navigation activePath="/create" />
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});

export default CreateScreen;
