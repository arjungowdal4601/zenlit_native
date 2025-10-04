import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export type ProfileActionsProps = {
  onEditPress?: () => void;
  onMessagePress?: () => void;
  onSharePress?: () => void;
  isCurrentUser?: boolean;
};

const ProfileActions: React.FC<ProfileActionsProps> = ({
  onEditPress,
  onMessagePress,
  onSharePress,
  isCurrentUser = false,
}) => {
  const handleEdit = () => {
    if (onEditPress) {
      onEditPress();
    } else {
      Alert.alert('Edit profile');
    }
  };

  const handleMessage = () => {
    if (onMessagePress) {
      onMessagePress();
    } else {
      Alert.alert('Message user');
    }
  };

  const handleShare = () => {
    if (onSharePress) {
      onSharePress();
    } else {
      Alert.alert('Share profile');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={[styles.button, styles.outlineButton]} onPress={handleEdit}>
        <Text style={[styles.label, styles.outlineLabel]}>{isCurrentUser ? 'Edit Profile' : 'Follow'}</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.primaryButton]} onPress={handleMessage}>
        <Text style={[styles.label, styles.primaryLabel]}>Message</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.outlineButton]} onPress={handleShare}>
        <Text style={[styles.label, styles.outlineLabel]}>Share</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.45)',
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  outlineLabel: {
    color: '#60a5fa',
  },
  primaryLabel: {
    color: '#ffffff',
  },
});

export default ProfileActions;
