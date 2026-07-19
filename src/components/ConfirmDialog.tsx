import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppDialog, { type AppDialogTone } from './ui/app-dialog';
import { theme } from '../styles/theme';

export type ConfirmDialogProps = {
  visible: boolean;
  message: string;
  title?: string;
  tone?: AppDialogTone;
  processing?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  message,
  title = 'Confirm action',
  tone = 'danger',
  processing = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const handleRequestClose = () => {
    if (!processing) onCancel();
  };

  return (
    <AppDialog
      visible={visible}
      onRequestClose={handleRequestClose}
      title={title}
      description={message}
      tone={tone}
      dismissOnBackdrop={!processing}
      accessibilityLabel={`${title}. ${message}`}
    >
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.cancelButton,
            pressed && !processing && styles.pressed,
            processing && styles.disabled,
          ]}
          onPress={handleRequestClose}
          disabled={processing}
          accessibilityRole="button"
          accessibilityState={{ disabled: processing }}
        >
          <Text style={[styles.buttonLabel, styles.cancelLabel]}>{cancelLabel}</Text>
        </Pressable>

        {tone === 'danger' ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.dangerButton,
              pressed && !processing && styles.pressed,
              processing && styles.disabled,
            ]}
            onPress={onConfirm}
            disabled={processing}
            accessibilityRole="button"
            accessibilityState={{ busy: processing, disabled: processing }}
          >
            {processing ? (
              <ActivityIndicator size="small" color={theme.prism.colors.text} />
            ) : (
              <Text style={styles.buttonLabel}>{confirmLabel}</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && !processing && styles.pressed,
              processing && styles.disabled,
            ]}
            onPress={onConfirm}
            disabled={processing}
            accessibilityRole="button"
            accessibilityState={{ busy: processing, disabled: processing }}
          >
            <LinearGradient
              colors={theme.prism.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {processing ? (
                <ActivityIndicator size="small" color={theme.prism.colors.text} />
              ) : (
                <Text style={styles.buttonLabel}>{confirmLabel}</Text>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </AppDialog>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radii.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: theme.prism.colors.cardDeep,
  },
  dangerButton: {
    backgroundColor: theme.prism.colors.danger,
  },
  gradientButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    ...theme.typography.label,
    color: theme.prism.colors.text,
    fontSize: 15,
  },
  cancelLabel: {
    color: theme.prism.colors.textSoft,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
});

export default ConfirmDialog;
