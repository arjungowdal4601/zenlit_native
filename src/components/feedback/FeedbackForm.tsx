import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import ImageUploadDialog from '../ImageUploadDialog';

const MAX_LENGTH = 1000;
const MIN_LENGTH = 10;

const FeedbackForm: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
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

  const handleImageSelected = (imageUri: string) => {
    setAttachedImage(imageUri);
    setShowImageUploadDialog(false);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  const uploadImageIfNeeded = async (uri: string | null, userId: string): Promise<string | undefined> => {
    try {
      if (!uri) return undefined;

      const isRemote = uri.startsWith('http');
      const isLocal = uri.startsWith('file:') || uri.startsWith('data:') || uri.startsWith('blob:');

      if (isRemote && !isLocal) {
        return uri;
      }

      const extMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      let contentType = 'image/jpeg';
      let ext = (extMatch && extMatch[1]) ? extMatch[1].toLowerCase() : 'jpg';

      if (uri.startsWith('data:')) {
        const mimeMatch = uri.match(/^data:(.*?);base64,/);
        if (mimeMatch && mimeMatch[1]) {
          contentType = mimeMatch[1];
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else ext = 'jpg';
        }
      } else {
        contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      }

      const fileName = `${userId}/feedback-${Date.now()}.${ext}`;

      const base64ToUint8Array = (b64: string): Uint8Array => {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let bufferLength = b64.length * 0.75;
        const len = b64.length;
        let p = 0;
        let encoded1, encoded2, encoded3, encoded4;

        if (b64[len - 1] === '=') bufferLength--;
        if (b64[len - 2] === '=') bufferLength--;

        const bytes = new Uint8Array(bufferLength | 0);

        for (let i = 0; i < len; i += 4) {
          encoded1 = base64Chars.indexOf(b64[i]);
          encoded2 = base64Chars.indexOf(b64[i + 1]);
          encoded3 = base64Chars.indexOf(b64[i + 2]);
          encoded4 = base64Chars.indexOf(b64[i + 3]);

          const triplet = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 & 63) << 6) | (encoded4 & 63);

          if (b64[i + 2] === '=') {
            bytes[p++] = (triplet >> 16) & 0xFF;
          } else if (b64[i + 3] === '=') {
            bytes[p++] = (triplet >> 16) & 0xFF;
            bytes[p++] = (triplet >> 8) & 0xFF;
          } else {
            bytes[p++] = (triplet >> 16) & 0xFF;
            bytes[p++] = (triplet >> 8) & 0xFF;
            bytes[p++] = triplet & 0xFF;
          }
        }
        return bytes;
      };

      let uploadBody: Uint8Array | Blob | ArrayBuffer;

      if (uri.startsWith('data:')) {
        const commaIndex = uri.indexOf(',');
        const base64Data = commaIndex !== -1 ? uri.slice(commaIndex + 1) : '';
        uploadBody = base64ToUint8Array(base64Data);
      } else if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        uploadBody = blob;
      } else {
        const response = await fetch(uri);
        const arrayBuffer = await (response as any).arrayBuffer?.();
        if (!arrayBuffer) {
          console.error('Unable to read file for upload');
          return undefined;
        }
        uploadBody = arrayBuffer as ArrayBuffer;
      }

      const { error: uploadError } = await supabase.storage
        .from('feedback-images')
        .upload(fileName, uploadBody as any, { contentType, upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return undefined;
      }

      const { data } = supabase.storage.from('feedback-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Failed to upload image:', err);
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
          <Image source={{ uri: attachedImage }} style={styles.imagePreview} resizeMode="cover" />
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
        currentImage={attachedImage}
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
