import React, { useCallback } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import Navigation from '../src/components/Navigation';
import { PostComposer } from '../src/components/PostComposer';
import { FEED_DATA } from '../src/constants/feedData';
import { theme } from '../src/styles/theme';

const DEFAULT_AUTHOR = FEED_DATA[0]?.author ?? {
  name: 'Zenlit Member',
  username: 'zenlit',
  avatar: undefined,
};

const CreateScreen: React.FC = () => {
  const handleShare = useCallback((content: string) => {
    console.log('Share post', content);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <AppHeader title="Create Post" />

      <View style={styles.content}>
        <PostComposer author={DEFAULT_AUTHOR} onShare={handleShare} />
      </View>

      <Navigation activePath="/create" />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
});

export default CreateScreen;
