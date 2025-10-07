import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { FEED_DATA } from '../constants/feedData';
import { useVisibility } from '../contexts/VisibilityContext';
import Post from './Post';

export const FeedList: React.FC = () => {
  const { selectedAccounts } = useVisibility();

  return (
    <View style={styles.container}>
      <FlatList
        data={FEED_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Post post={item} selectedAccounts={selectedAccounts} showTimestamp={false} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingBottom: 160,
    paddingTop: 8,
  },
});

export default FeedList;
