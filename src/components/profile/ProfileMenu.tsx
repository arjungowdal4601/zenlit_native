import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ProfileMenuProps = {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onFeedback: () => void;
  onLogout: () => void;
};

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onClose,
  onEditProfile,
  onFeedback,
  onLogout,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole='button'
          accessibilityLabel='Close profile menu'
        />
        <View style={styles.positioner} pointerEvents='box-none'>
          <View style={styles.card}>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole='button'
              accessibilityLabel='Dismiss menu'
            >
              <Text style={styles.closeText}>X</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              onPress={onEditProfile}
              accessibilityRole='button'
            >
              <View style={styles.iconWrap}>
                <Feather name="edit-3" size={18} color="#cbd5f5" />
              </View>
              <Text style={styles.rowLabel}>Edit Profile</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              onPress={onFeedback}
              accessibilityRole='button'
            >
              <View style={styles.iconWrap}>
                <Feather name="message-square" size={18} color="#cbd5f5" />
              </View>
              <Text style={styles.rowLabel}>Give Feedback</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              onPress={onLogout}
              accessibilityRole='button'
            >
              <View style={styles.iconWrap}>
                <Feather name="log-out" size={18} color="#cbd5f5" />
              </View>
              <Text style={styles.rowLabel}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
  },
  positioner: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  card: {
    width: 220,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
  },
  closeText: {
    color: '#cbd5f5',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
  },
  rowLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileMenu;
