import React from 'react';
import { StyleSheet, View } from 'react-native';

import GradientText from './GradientText';

const ScreenHeader: React.FC<{ title: string; actions?: React.ReactNode }> = ({ title, actions }) => (
  <View style={styles.container}>
    <GradientText textStyle={styles.title} gradientStyle={styles.gradientPadding}>
      {title}
    </GradientText>
    <View style={styles.actions}>{actions}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    textAlign: 'left',
  },
  gradientPadding: {
    paddingHorizontal: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ScreenHeader;
