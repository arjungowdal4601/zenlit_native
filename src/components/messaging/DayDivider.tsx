import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type DayDividerProps = {
  label: string;
};

const DayDivider: React.FC<DayDividerProps> = ({ label }) => (
  <View style={styles.container}>
    <View style={styles.line} />
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
  },
  badge: {
    marginHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  text: {
    fontSize: 12,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
});

export default DayDivider;
