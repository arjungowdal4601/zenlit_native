import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '../icons';
import { submitFeedback } from '../../services/feedbackService';
import { usePendingUpload } from '../../hooks/usePendingUpload';
import type { ImageUploadTarget, StoredImage } from '../../types/stored-image';
import ImageUploadDialog from '../ImageUploadDialog';
import { useAppToast } from '../ui/app-toast';

const MAX_LENGTH = 1000;
const MIN_LENGTH = 10;
const FEEDBACK_UPLOAD_TARGET = {
  bucket: 'feedback-images',
  prefix: 'feedback',
} as const satisfies ImageUploadTarget;

const FeedbackForm: React.FC = () => {
  const { showToast } = useAppToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachedUpload = usePendingUpload();
  const attachedImage = attachedUpload.image;
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const remaining = useMemo(() => `${message.length}/${MAX_LENGTH} characters`, [message.length]);

  const handleAttachPress = () => {
    if (isSubmitting) return;
    setShowImageUploadDialog(true);
  };

  const handleImageUploaded = async (image: StoredImage) => {
    await attachedUpload.replace(image);
    setShowImageUploadDialog(false);
  };

  const handleRemoveImage = async () => {
    if (isSubmitting) return;
    await attachedUpload.discard();
  };

  const handleSubmit = async () => {
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
    setError(null);
    const releasePersistence = attachedUpload.beginPersistence();

    try {
      const { error: insertError } = await submitFeedback(trimmed, attachedImage);

      if (insertError) {
        throw insertError;
      }

      attachedUpload.commit();
      if (mountedRef.current) {
        setMessage('');
        showToast({
          message: 'Thank you! Your feedback has been submitted successfully.',
          tone: 'success',
        });
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      if (mountedRef.current) {
        showToast({ message: 'Failed to submit feedback. Please try again.', tone: 'error' });
      }
    } finally {
      releasePersistence();
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Your Feedback<Text style={styles.required}> *</Text></Text>
        <Pressable
          style={[styles.attachButton, isSubmitting && styles.submitDisabled]}
          onPress={handleAttachPress}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Attach image"
          accessibilityState={{ disabled: isSubmitting }}
        >
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
        editable={!isSubmitting}
      />

      {attachedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: attachedImage.publicUrl }} style={styles.imagePreview} resizeMode="cover" />
          <Pressable
            style={styles.removeImageButton}
            onPress={handleRemoveImage}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
            accessibilityState={{ disabled: isSubmitting }}
          >
            <Feather name="x" size={16} color="#ffffff" />
          </Pressable>
        </View>
      )}

      {error ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      {!error && message.trim().length > 0 && message.trim().length < MIN_LENGTH ? (
        <Text style={styles.hintText}>Enter at least 10 characters.</Text>
      ) : null}
      <Text style={styles.charCount}>{remaining}</Text>

      <Pressable
        style={[styles.submitButton, (isSubmitting || message.trim().length === 0) ? styles.submitDisabled : null]}
        onPress={handleSubmit}
        disabled={isSubmitting || message.trim().length === 0}
        accessibilityRole="button"
      >
        <Text style={styles.submitLabel}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Text>
      </Pressable>

      <ImageUploadDialog
        visible={showImageUploadDialog && !isSubmitting}
        onClose={() => setShowImageUploadDialog(false)}
        onImageUploaded={handleImageUploaded}
        uploadTarget={FEEDBACK_UPLOAD_TARGET}
        title="Attach Image"
        currentImage={attachedImage?.publicUrl}
        onRemove={handleRemoveImage}
        showRemoveOption={!!attachedImage}
        imageKind="attachment"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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



