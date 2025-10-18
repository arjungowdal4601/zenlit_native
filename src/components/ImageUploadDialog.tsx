import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { compressImage, type CompressedImage } from '../utils/imageCompression';

export type ImageUploadDialogProps = {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (image: CompressedImage | null) => void;
  title?: string;
  currentImage?: string | null;
  onRemove?: () => void;
  showRemoveOption?: boolean;
};

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  visible,
  onClose,
  onImageSelected,
  title = "Upload Image",
  currentImage,
  onRemove,
  showRemoveOption = false
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedUploadUri, setSelectedUploadUri] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleCameraCapture = async () => {
    console.log('Camera capture initiated...');
    console.log('Platform:', Platform.OS);
    
    // Check if we're on web platform
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available', 
        'Camera functionality is not available in web browsers. Please use "Upload from Gallery" to select an image from your device.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.log('Camera permission denied');
      return;
    }

    console.log('Camera permission granted, launching camera...');
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        // Use string media types per Expo SDK 52+ changes
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Image captured successfully:', asset.uri);
        const displayUri = asset.uri;
        const uploadUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedImage(displayUri);
        setSelectedUploadUri(uploadUri);
        setIsPreviewMode(true);
      } else {
        console.log('Camera capture was canceled or failed');
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Error', `Failed to capture image: ${errorMessage}`);
    }
  };

  const handleFileUpload = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // Use string media types per Expo SDK 52+ changes
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const displayUri = asset.uri;
        const uploadUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedImage(displayUri);
        setSelectedUploadUri(uploadUri);
        setIsPreviewMode(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleConfirmUpload = async () => {
    const finalUri = selectedUploadUri ?? selectedImage;
    if (!finalUri || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImage(finalUri);
      onImageSelected(compressed);
      handleClose();
    } catch (error) {
      console.error('Image compression failed:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Unable to process image', message.includes('compress') ? message : 'We could not optimise this image. Please try again or choose a different photo.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSelectedUploadUri(null);
    setIsPreviewMode(false);
    setIsProcessing(false);
    onClose();
  };

  const handleBackToOptions = () => {
    setSelectedImage(null);
    setSelectedUploadUri(null);
    setIsPreviewMode(false);
    setIsProcessing(false);
  };

  const handleRemoveImage = () => {
    if (Platform.OS === 'web') {
      const confirmRemoval =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm.bind(window)
          : () => true;

      const confirmed = confirmRemoval('Are you sure you want to remove this image?');
      if (!confirmed) {
        return;
      }

      if (onRemove) {
        onRemove();
      } else {
        onImageSelected(null);
      }
      handleClose();
      return;
    }

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (onRemove) {
              onRemove();
            } else {
              onImageSelected(null);
            }
            handleClose();
          }
        }
      ]
    );
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={handleClose} />
        <View style={styles.card}>
          {isPreviewMode ? (
            // Preview Mode
            <>
              <View style={styles.header}>
                <Pressable onPress={handleBackToOptions} style={styles.backButton}>
                  <Feather name="arrow-left" size={20} color="#cbd5f5" />
                </Pressable>
                <Text style={styles.title}>Preview Image</Text>
                <View style={{ width: 32 }} />
              </View>
              
              <View style={styles.previewContainer}>
                {selectedImage && (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                )}
              </View>

              <View style={styles.previewActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed ? styles.actionButtonPressed : null,
                    isProcessing ? styles.actionButtonDisabled : null,
                  ]}
                  onPress={handleBackToOptions}
                  disabled={isProcessing}
                >
                  <Text style={styles.actionButtonText}>Retake</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.confirmButton,
                    isProcessing ? styles.actionButtonDisabled : null,
                    pressed && !isProcessing ? styles.actionButtonPressed : null,
                  ]}
                  onPress={handleConfirmUpload}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <View style={styles.confirmButtonContent}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={[styles.actionButtonText, styles.confirmButtonText, styles.processingLabel]}>
                        Optimising…
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.actionButtonText, styles.confirmButtonText]}>Use Photo</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            // Options Mode
            <>
              <Text style={styles.title}>{title}</Text>
              
              <Pressable
                onPress={handleCameraCapture}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowOutline,
                  pressed ? styles.rowPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Take photo with camera"
              >
                <View style={styles.rowInner}>
                  <View style={styles.rowIcon}>
                    <Feather name="camera" size={16} color="#cbd5f5" />
                  </View>
                  <Text style={styles.rowLabel}>Take Photo</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleFileUpload}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowOutline,
                  pressed ? styles.rowPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Upload from gallery"
              >
                <View style={styles.rowInner}>
                  <View style={styles.rowIcon}>
                    <Feather name="upload" size={16} color="#cbd5f5" />
                  </View>
                  <Text style={styles.rowLabel}>Upload from Gallery</Text>
                </View>
              </Pressable>

              {showRemoveOption && currentImage && (
                <Pressable
                  onPress={handleRemoveImage}
                  style={({ pressed }) => [
                    styles.row,
                    styles.rowOutline,
                    styles.rowDestructive,
                    pressed ? styles.rowPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove current image"
                >
                  <View style={styles.rowInner}>
                    <View style={styles.rowIcon}>
                      <Feather name="x" size={16} color="#fca5a5" />
                    </View>
                    <Text style={[styles.rowLabel, styles.rowLabelDestructive]}>Remove Image</Text>
                  </View>
                </Pressable>
              )}

              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? styles.rowPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <View style={styles.rowInner}>
                  <Text style={[styles.rowLabel, styles.rowLabelCenter]}>Cancel</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 24,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.22)',
    marginBottom: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  confirmButton: {
    backgroundColor: '#6d28d9',
    borderColor: '#6d28d9',
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
  },
  processingLabel: {
    marginLeft: 6,
  },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  rowOutline: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.65)',
  },
  rowDestructive: {},
  rowIcon: {
    width: 20,
    alignItems: 'center',
  },
  rowLabel: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  rowLabelCenter: {
    textAlign: 'center',
    width: '100%',
  },
  rowLabelDestructive: {
    color: '#fca5a5',
  },
});

export default ImageUploadDialog;
