import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const MAX_LENGTH = 1000;
const MIN_LENGTH = 10;

const FeedbackForm: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filePickerRef = useRef<null>(null);

  const remaining = useMemo(() => `${message.length}/${MAX_LENGTH} characters`, [message.length]);

  const handleAttachPress = () => {
    console.log('attach pressed');
    Alert.alert('Attachment', 'Image attachments are not available in this build.');
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Feedback text is required');
      return;
    }
    if (trimmed.length < MIN_LENGTH) {
      setError(`Feedback must be at least ${MIN_LENGTH} characters long`);
      return;
    }

    setIsSubmitting(true);
    console.log('feedback submit', { message: trimmed });
    setTimeout(() => {
      setShowSuccess(true);
      setIsSubmitting(false);
      setMessage('');
      setError(null);
    }, 400);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Your Feedback<Text style={styles.required}> *</Text></Text>
        <Pressable style={styles.attachButton} onPress={handleAttachPress} accessibilityRole="button">
          <Feather name="paperclip" size={16} color="#ffffff" />
          <Text style={styles.attachLabel}>Attach</Text>
        </Pressable>
      </View>

      <TextInput
        style={[styles.textInput, error ? styles.textInputError : null]}
        value={message}
        multiline
        onChangeText={(value) => {
          if (error) {
            setError(null);
          }
          if (value.length <= MAX_LENGTH) {
            setMessage(value);
          }
        }}
        placeholder="Tell us what you think about Zenlit. What features do you love? What could be improved? Any bugs or issues you've encountered?"
        placeholderTextColor="#94a3b8"
        textAlignVertical="top"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && message.trim().length > 0 && message.trim().length < MIN_LENGTH ? (
        <Text style={styles.hintText}>Enter at least 10 characters.</Text>
      ) : null}
      <Text style={styles.charCount}>{remaining}</Text>

      {showSuccess ? (
        <View style={styles.successBanner}>
          <Feather name="check" size={16} color="#4ade80" />
          <Text style={styles.successText}>Thank you! Your feedback has been submitted successfully.</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.submitButton, (isSubmitting || showSuccess || message.trim().length === 0) ? styles.submitDisabled : null]}
        onPress={handleSubmit}
        disabled={isSubmitting || showSuccess || message.trim().length === 0}
        accessibilityRole="button"
      >
        <Text style={styles.submitLabel}>
          {isSubmitting ? 'Submitting...' : showSuccess ? 'Submitted!' : 'Submit Feedback'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  required: {
    color: '#f87171',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  attachLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  textInputError: {
    borderColor: '#f87171',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  hintText: {
    color: '#60a5fa',
    fontSize: 12,
  },
  charCount: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'right',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(22, 101, 52, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successText: {
    color: '#bbf7d0',
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  submitDisabled: {
    backgroundColor: 'rgba(37,99,235,0.35)',
  },
  submitLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FeedbackForm;
