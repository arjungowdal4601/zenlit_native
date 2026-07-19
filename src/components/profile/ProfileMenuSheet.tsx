import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../styles/theme';
import { Feather } from '../icons';
import { AppBottomSheet } from '../ui/app-bottom-sheet';

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
  const runAction = (action: () => void) => {
    onRequestClose();
    action();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onRequestClose={onRequestClose}
      title="Menu"
      accessibilityLabel="Profile menu"
    >
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => runAction(onEditProfile)}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
        >
          <View style={styles.iconWrap}>
            <Feather name="edit-3" size={18} color={theme.prism.colors.textSoft} />
          </View>
          <Text style={styles.rowLabel}>Edit Profile</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => runAction(onFeedback)}
          accessibilityRole="button"
          accessibilityLabel="Give Feedback"
        >
          <View style={styles.iconWrap}>
            <Feather name="message-square" size={18} color={theme.prism.colors.textSoft} />
          </View>
          <Text style={styles.rowLabel}>Give Feedback</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => runAction(onLogout)}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <View style={[styles.iconWrap, styles.destructiveIcon]}>
            <Feather name="log-out" size={18} color="#FCA5A5" />
          </View>
          <Text style={[styles.rowLabel, styles.destructiveLabel]}>Logout</Text>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(8, 13, 16, 0.68)',
    paddingHorizontal: 12,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: theme.prism.colors.borderStrong,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  rowLabel: {
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.system,
    fontSize: 15,
    fontWeight: '600',
  },
  destructiveIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  destructiveLabel: {
    color: '#FCA5A5',
  },
});

export default ProfileMenuSheet;
