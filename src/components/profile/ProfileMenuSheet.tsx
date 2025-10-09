import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ProfileMenuSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  onEditProfile: () => void;
  onFeedback: () => void;
  onLogout: () => void;
};

const ProfileMenuSheet: React.FC<ProfileMenuSheetProps> = ({
  visible,
  onRequestClose,
  onEditProfile,
  onFeedback,
  onLogout,
}) => {
  const translateY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 1,
      duration: 260,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateY, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onRequestClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Menu</Text>
            <Pressable style={styles.iconButton} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="Close menu">
              <Feather name="x" size={20} color="#ffffff" />
            </Pressable>
          </View>

          <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={() => { onRequestClose(); onEditProfile(); }}>
            <View style={styles.iconWrap}>
              <Feather name="edit-3" size={18} color="#ffffff" />
            </View>
            <Text style={styles.rowLabel}>Edit Profile</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={() => { onRequestClose(); onFeedback(); }}>
            <View style={styles.iconWrap}>
              <Feather name="message-square" size={18} color="#ffffff" />
            </View>
            <Text style={styles.rowLabel}>Give Feedback</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={() => { onRequestClose(); onLogout(); }}>
            <View style={styles.iconWrap}>
              <Feather name="log-out" size={18} color="#ffffff" />
            </View>
            <Text style={styles.rowLabel}>Logout</Text>
          </Pressable>
        </Animated.View>
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(71, 85, 105, 0.6)',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(30, 41, 59, 0.22)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileMenuSheet;