import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/database';
import { compressImage, MAX_IMAGE_SIZE_BYTES, base64ToUint8Array, type CompressedImage } from '../../utils/imageCompression';
import ImageUploadDialog from '../ImageUploadDialog';

const MAX_LENGTH = 1000;
const MIN_LENGTH = 10;

const FeedbackForm: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<CompressedImage | null>(null);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);

  const mountedRef = useRef(true);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const remaining = useMemo(() => `${message.length}/${MAX_LENGTH} characters`, [message.length]);

  const handleAttachPress = () => {
    setShowImageUploadDialog(true);
  };

  const handleImageSelected = (image: CompressedImage | null) => {
    setAttachedImage(image);
    setShowImageUploadDialog(false);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  const uploadImageIfNeeded = async (image: CompressedImage | null, _userId: string): Promise<string | undefined> => {
    try {
      if (!image) {
        return undefined;
      }

      let workingImage = image;

      if (
        workingImage.size > MAX_IMAGE_SIZE_BYTES ||
        workingImage.metadata.compressedSize > MAX_IMAGE_SIZE_BYTES
      ) {
        workingImage = await compressImage(workingImage.uri);
      }

      const fileName = `feedback-${Date.now()}.jpg`;
      const uploadBody = workingImage.base64
        ? base64ToUint8Array(workingImage.base64)
        : workingImage.uri;

      const { url, error } = await uploadImage(uploadBody, 'feedback-images', fileName, {
        contentType: workingImage.mimeType,
      });

      if (error || !url) {
        throw error ?? new Error('Upload failed');
      }

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[feedback-upload]', workingImage.metadata);
      }

      return url;
    } catch (uploadError) {
      console.error('Failed to upload feedback image:', uploadError);
      return undefined;
    }
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

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let imageUrl: string | undefined = undefined;
      if (attachedImage) {
        imageUrl = await uploadImageIfNeeded(attachedImage, user.id);
        if (!imageUrl) {
          throw new Error('Failed to upload your screenshot. Please try again.');
        }
      }

      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          message: trimmed,
          image_url: imageUrl || null,
        });

      if (insertError) {
        throw insertError;
      }

      if (mountedRef.current) {
        setShowSuccess(true);
        setMessage('');
        setAttachedImage(null);

        successTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setShowSuccess(false);
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      if (mountedRef.current) {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
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

      {attachedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: attachedImage.uri }} style={styles.imagePreview} resizeMode="cover" />
          <Pressable style={styles.removeImageButton} onPress={handleRemoveImage}>
            <Feather name="x" size={16} color="#ffffff" />
          </Pressable>
        </View>
      )}

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

      <ImageUploadDialog
        visible={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        onImageSelected={handleImageSelected}
        title="Attach Image"
        currentImage={attachedImage?.uri}
        onRemove={handleRemoveImage}
        showRemoveOption={!!attachedImage}
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



