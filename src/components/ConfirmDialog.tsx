import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type ConfirmDialogProps = {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonLabel, styles.cancelLabel]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>{confirmLabel}</Text>
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
  confirmButton: {
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

export default ConfirmDialog;