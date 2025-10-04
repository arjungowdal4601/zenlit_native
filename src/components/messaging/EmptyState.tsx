import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type EmptyStateProps = {
  title: string;
  subtitle?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default EmptyState;
