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
    // Remove dividing lines
    flex: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  badge: {
    // No pill/bounds; plain label
    marginHorizontal: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
});

export default DayDivider;
