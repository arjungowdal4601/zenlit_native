import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ProfileHeaderProps = {
  name: string;
  username: string;
  avatar?: string;
  distance?: string;
  isVerified?: boolean;
};

const FALLBACK_AVATAR =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ name, username, avatar, distance, isVerified }) => {
  const avatarUri = avatar && avatar.trim().length ? avatar : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      <View style={styles.banner} />
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          {isVerified ? <Feather name="check-circle" size={18} color="#60a5fa" /> : null}
        </View>
        <Text style={styles.username}>@{username}</Text>
        {distance ? <Text style={styles.distance}>{distance} away</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  banner: {
    width: '100%',
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  avatarWrapper: {
    marginTop: -40,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#0f172a',
    padding: 4,
    backgroundColor: '#0f172a',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111827',
  },
  info: {
    marginTop: 16,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  username: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 15,
  },
  distance: {
    marginTop: 8,
    color: '#cbd5f5',
    fontSize: 13,
  },
});

export default ProfileHeader;
