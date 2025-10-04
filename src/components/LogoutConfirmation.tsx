import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type LogoutConfirmationProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeButton} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.closeLabel}>×</Text>
          </Pressable>
          <Text style={styles.message}>Are you sure you want to log out?</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel} accessibilityRole="button">
              <Text style={[styles.buttonLabel, styles.cancelLabel]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.logoutButton]}
              onPress={() => {
                console.log('logout confirmed');
                onConfirm();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 24,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  closeLabel: {
    color: '#cbd5f5',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: '#e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelLabel: {
    color: '#cbd5f5',
  },
});

export default LogoutConfirmation;
