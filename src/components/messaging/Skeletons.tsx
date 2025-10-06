import React from 'react';
import { StyleSheet, View } from 'react-native';

export type SkeletonRowsProps = {
  count?: number;
};

const SkeletonRows: React.FC<SkeletonRowsProps> = ({ count = 6 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.textBlock}>
            <View style={styles.linePrimary} />
            <View style={styles.lineSecondary} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  textBlock: {
    flex: 1,
    gap: 8,
  },
  linePrimary: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.7)',
  },
  lineSecondary: {
    height: 10,
    width: '60%',
    borderRadius: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.55)',
  },
});

export default SkeletonRows;
