import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface AttachmentDialogProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
}

const AttachmentDialog: React.FC<AttachmentDialogProps> = ({
  visible,
  onClose,
  onImageSelected,
}) => {
  const handleCameraCapture = async () => {
    console.log('Camera capture initiated...');
    console.log('Platform:', Platform.OS);
    
    // Check if we're on web platform
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available',
        'Camera functionality is not available on web browsers. Please use "Upload from Gallery" instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Error', `Failed to capture image: ${errorMessage}`);
    }
  };

  const handleFileUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Error', `Failed to select image: ${errorMessage}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Attach Image</Text>
          
          <View style={styles.options}>
            <Pressable
              style={styles.option}
              onPress={handleCameraCapture}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
            >
              <View style={styles.optionIcon}>
                <Feather name="camera" size={20} color="#ffffff" />
              </View>
              <Text style={styles.optionText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={handleFileUpload}
              accessibilityRole="button"
              accessibilityLabel="Upload from gallery"
            >
              <View style={styles.optionIcon}>
                <Feather name="image" size={20} color="#ffffff" />
              </View>
              <Text style={styles.optionText}>Upload from Gallery</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.cancelButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: '#000000',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109, 40, 217, 0.2)',
    marginRight: 12,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: '#000000',
  },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttachmentDialog;