import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { gradientColors, theme } from '../../styles/theme';

export type ComposerProps = {
  onSend: (value: string) => void;
  disabled?: boolean;
};

const Composer: React.FC<ComposerProps> = ({ onSend, disabled = false }) => {
  const [value, setValue] = useState('');
  const canSend = useMemo(() => !disabled && value.trim().length > 0, [disabled, value]);

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    const trimmed = value.trim();
    onSend(trimmed);
    setValue('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={[styles.inputWrapper, disabled ? styles.inputDisabled : null]}>
          <TextInput
            style={[styles.input, disabled ? styles.inputTextDisabled : null]}
            value={value}
            onChangeText={setValue}
            placeholder={disabled ? 'Chat is read-only.' : 'Type a message'}
            placeholderTextColor={disabled ? theme.colors.iconInactive : theme.colors.muted}
            editable={!disabled}
            multiline
            numberOfLines={1}
            maxLength={800}
            textAlignVertical="center"
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={({ pressed }) => [
            styles.sendButtonTouchable,
            !canSend ? styles.sendButtonTouchableDisabled : null,
            pressed && canSend ? styles.sendButtonTouchablePressed : null,
          ]}
        >
          {canSend ? (
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendButton}>
              <Feather name="send" size={16} color="#ffffff" />
            </LinearGradient>
          ) : (
            <View style={[styles.sendButton, styles.sendButtonDisabled]}>
              <Feather name="send" size={16} color={theme.colors.iconInactive} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingBottom: 12,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    height: 36,
    paddingVertical: 8,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  inputTextDisabled: {
    color: theme.colors.iconInactive,
  },
  sendButtonTouchable: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendButtonTouchableDisabled: {
    opacity: 0.6,
  },
  sendButtonTouchablePressed: {
    transform: [{ scale: 0.96 }],
  },
  sendButton: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
});

export default Composer;
