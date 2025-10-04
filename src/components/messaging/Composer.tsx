import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

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
            placeholderTextColor={disabled ? '#64748b' : '#94a3b8'}
            editable={!disabled}
            multiline
            maxLength={800}
            textAlignVertical="top"
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}
        >
          <Feather name="send" size={18} color={canSend ? '#ffffff' : '#64748b'} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    paddingBottom: 12,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 20,
  },
  inputTextDisabled: {
    color: '#64748b',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
});

export default Composer;
