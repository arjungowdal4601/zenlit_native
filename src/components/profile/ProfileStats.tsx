import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ProfileStatsProps = {
  posts?: number;
  followers?: number;
  following?: number;
};

const formatNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }
  return String(value);
};

const ProfileStats: React.FC<ProfileStatsProps> = ({
  posts = 0,
  followers = 0,
  following = 0,
}) => (
  <View style={styles.container}>
    <View style={styles.item}>
      <Text style={styles.value}>{formatNumber(posts)}</Text>
      <Text style={styles.label}>Posts</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.item}>
      <Text style={styles.value}>{formatNumber(followers)}</Text>
      <Text style={styles.label}>Followers</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.item}>
      <Text style={styles.value}>{formatNumber(following)}</Text>
      <Text style={styles.label}>Following</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    paddingVertical: 14,
    marginBottom: 24,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(51, 65, 85, 0.7)',
  },
});

export default ProfileStats;
