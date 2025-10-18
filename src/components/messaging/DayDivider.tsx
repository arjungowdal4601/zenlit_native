import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type DayDividerProps = {
  label: string; // expects dd/mm/yyyy
};

const DayDivider: React.FC<DayDividerProps> = ({ label }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.35)', // thin grey line
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
  },
});

export default DayDivider;
