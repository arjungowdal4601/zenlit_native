import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type SuccessPopupProps = {
  visible: boolean;
  message?: string;
  duration?: number; // milliseconds
  onDismiss?: () => void;
};

const SuccessPopup: React.FC<SuccessPopupProps> = ({
  visible,
  message = 'Post created successfully',
  duration = 2000,
  onDismiss,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityRole="button" />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="check-circle" size={40} color="#22c55e" />
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    marginBottom: 12,
  },
  message: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SuccessPopup;