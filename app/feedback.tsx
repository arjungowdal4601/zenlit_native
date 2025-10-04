import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FeedbackForm from '../src/components/feedback/FeedbackForm';
import Navigation from '../src/components/Navigation';

const FeedbackScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.leadText}>
          Tell us what you think about Zenlit. We read every note.
        </Text>
        <FeedbackForm />
      </ScrollView>

      <Navigation activePath="/feedback" />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#60a5fa',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 160,
    gap: 20,
  },
  leadText: {
    color: '#cbd5f5',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default FeedbackScreen;
