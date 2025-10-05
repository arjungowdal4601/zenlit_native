import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppHeader from '../../src/components/AppHeader';
import ChatList from '../../src/components/messaging/ChatList';
import Navigation from '../../src/components/Navigation';
import { THREADS } from '../../src/constants/messagesData';

const MessagesScreen: React.FC = () => {
  const router = useRouter();

  const sortedThreads = useMemo(
    () => [...THREADS].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader title="Message" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ChatList
          threads={sortedThreads}
          onPressThread={(threadId) => router.push(`/messages/${threadId}`)}
        />
      </ScrollView>
      <Navigation activePath="/messages" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 180,
  },
});

export default MessagesScreen;
