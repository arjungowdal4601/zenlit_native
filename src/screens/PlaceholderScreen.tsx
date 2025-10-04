import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { COLORS } from '../theme/colors';

type PlaceholderScreenProps = {
  label: string;
};

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ label }) => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      <ScreenHeader title={label} />
      <View style={styles.divider} />
      <View style={styles.content}>
        {/* Content will be added here for each specific screen */}
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginHorizontal: 24,
  },
  content: {
    flex: 1,
  },
});

export default PlaceholderScreen;
