import { LinearGradient } from 'expo-linear-gradient';
import {
  CameraView,
  useCameraPermissions,
  type CameraMountError,
  type CameraType,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '../styles/theme';
import { compressImage, type CompressedImage } from '../utils/imageCompression';
import { Feather } from './icons';
import AppDialog from './ui/app-dialog';

export type ImageKind = 'avatar' | 'banner' | 'attachment';

export type ImageUploadDialogProps = {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (image: CompressedImage | null) => void;
  imageKind: ImageKind;
  title?: string;
  currentImage?: string | null;
  onRemove?: () => void;
  showRemoveOption?: boolean;
};

type DialogStep = 'source' | 'permission' | 'camera' | 'preview' | 'remove';
type SelectedSource = 'gallery' | 'camera';
type IssueKind =
  | 'gallery-permission'
  | 'gallery'
  | 'camera-permission'
  | 'camera-unavailable'
  | 'camera-mount'
  | 'camera-capture'
  | 'processing';

type InlineIssue = {
  kind: IssueKind;
  message: string;
  canRetry?: boolean;
};

type SelectedImage = {
  displayUri: string;
  uploadUri: string;
  source: SelectedSource;
};

const CAMERA_PERMISSION_COPY =
  'Allow camera access to take a photo. Zenlit never requests microphone access.';

const getDefaultFacing = (imageKind: ImageKind): CameraType =>
  imageKind === 'avatar' ? 'front' : 'back';

const getPickerOptions = (imageKind: ImageKind): ImagePicker.ImagePickerOptions => ({
  mediaTypes: ['images'],
  allowsEditing: imageKind === 'avatar',
  ...(imageKind === 'avatar' ? { aspect: [1, 1] as [number, number] } : {}),
  quality: 0.9,
  base64: true,
});

const getDataUri = (base64: string | null | undefined, mimeType = 'image/jpeg') =>
  base64 ? `data:${mimeType};base64,${base64}` : null;

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  visible,
  onClose,
  onImageSelected,
  imageKind,
  title = 'Add a photo',
  currentImage,
  onRemove,
  showRemoveOption = false,
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const visibleRef = useRef(visible);
  const mountedRef = useRef(true);
  const sessionRef = useRef(0);
  const operationSessionRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const [step, setStep] = useState<DialogStep>('source');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [facing, setFacing] = useState<CameraType>(() => getDefaultFacing(imageKind));
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [issue, setIssue] = useState<InlineIssue | null>(null);

  const resetDialogState = () => {
    cameraRef.current = null;
    setStep('source');
    setSelectedImage(null);
    setFacing(getDefaultFacing(imageKind));
    setCameraAttempt(0);
    setIsCameraReady(false);
    setIsBusy(false);
    setIsProcessing(false);
    setIssue(null);
  };

  useEffect(() => {
    visibleRef.current = visible;
    sessionRef.current += 1;
    operationSessionRef.current = null;
    completedRef.current = !visible;
    resetDialogState();
    // Reset every new dialog session and whenever its image purpose changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, imageKind]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      visibleRef.current = false;
      sessionRef.current += 1;
      operationSessionRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  const beginOperation = () => {
    if (operationSessionRef.current !== null || completedRef.current) {
      return null;
    }

    const session = sessionRef.current;
    operationSessionRef.current = session;
    return session;
  };

  const isActiveSession = (session: number) =>
    mountedRef.current && visibleRef.current && sessionRef.current === session;

  const finishOperation = (session: number) => {
    if (operationSessionRef.current === session) {
      operationSessionRef.current = null;
    }
  };

  const finishDialog = (beforeClose?: () => void) => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    visibleRef.current = false;
    sessionRef.current += 1;
    operationSessionRef.current = null;
    resetDialogState();

    try {
      beforeClose?.();
    } finally {
      onClose();
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      return;
    }
    finishDialog();
  };

  const chooseFromGallery = async () => {
    const session = beginOperation();
    if (session === null) {
      return;
    }

    const shouldUnmountCamera = step === 'camera' || step === 'permission';
    if (shouldUnmountCamera) {
      cameraRef.current = null;
      setStep('source');
      setIsCameraReady(false);
    }

    setIssue(null);
    setIsBusy(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!isActiveSession(session)) {
        return;
      }

      if (permission.status !== 'granted') {
        setIssue({
          kind: 'gallery-permission',
          canRetry: permission.canAskAgain !== false,
          message:
            permission.canAskAgain === false
              ? 'Photo access is blocked. Update your browser or device settings, then try again.'
              : 'Allow photo access to choose an image from your gallery.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(getPickerOptions(imageKind));
      if (!isActiveSession(session) || result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const encodedUri = getDataUri(asset.base64, asset.mimeType ?? 'image/jpeg');
      setSelectedImage({
        displayUri: asset.uri,
        uploadUri: encodedUri ?? asset.uri,
        source: 'gallery',
      });
      setStep('preview');
    } catch (error) {
      console.error('Image picker failed:', error);
      if (isActiveSession(session)) {
        setIssue({
          kind: 'gallery',
          canRetry: true,
          message: 'We couldn’t open your gallery. Please try again.',
        });
      }
    } finally {
      if (isActiveSession(session)) {
        setIsBusy(false);
      }
      finishOperation(session);
    }
  };

  const openCamera = async () => {
    const session = beginOperation();
    if (session === null) {
      return;
    }

    setStep('permission');
    setIssue(null);
    setIsBusy(true);
    setIsCameraReady(false);

    try {
      const isAvailable = await CameraView.isAvailableAsync();
      if (!isActiveSession(session)) {
        return;
      }

      if (!isAvailable) {
        setIssue({
          kind: 'camera-unavailable',
          canRetry: true,
          message:
            'We couldn’t find a camera on this device. You can still choose a photo from your gallery.',
        });
        return;
      }

      const permission =
        cameraPermission?.granted || cameraPermission?.canAskAgain === false
          ? cameraPermission
          : await requestCameraPermission();
      if (!isActiveSession(session)) {
        return;
      }

      if (!permission.granted) {
        setIssue({
          kind: 'camera-permission',
          canRetry: permission.canAskAgain !== false,
          message:
            permission.canAskAgain === false
              ? 'Camera access is blocked. Update your browser or device settings, then return here.'
              : CAMERA_PERMISSION_COPY,
        });
        return;
      }

      setFacing(getDefaultFacing(imageKind));
      setCameraAttempt((attempt) => attempt + 1);
      setStep('camera');
    } catch (error) {
      console.error('Camera permission or availability check failed:', error);
      if (isActiveSession(session)) {
        setIssue({
          kind: 'camera-unavailable',
          canRetry: true,
          message: 'We couldn’t start the camera. Please try again or choose from your gallery.',
        });
      }
    } finally {
      if (isActiveSession(session)) {
        setIsBusy(false);
      }
      finishOperation(session);
    }
  };

  const retryMountedCamera = () => {
    if (isBusy || isProcessing) {
      return;
    }
    setIssue(null);
    setIsCameraReady(false);
    setCameraAttempt((attempt) => attempt + 1);
    setStep('camera');
  };

  const handleCameraMountError = (error: CameraMountError) => {
    if (!mountedRef.current || !visibleRef.current) {
      return;
    }
    console.error('Camera preview failed to mount:', error.message);
    cameraRef.current = null;
    setIsCameraReady(false);
    setIssue({
      kind: 'camera-mount',
      canRetry: true,
      message:
        'We couldn’t start the camera preview. Check that another app isn’t using it, then try again.',
    });
  };

  const handleFlipCamera = () => {
    if (isBusy || isProcessing) {
      return;
    }
    setIssue(null);
    setIsCameraReady(false);
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      return;
    }

    const session = beginOperation();
    if (session === null) {
      return;
    }

    setIssue(null);
    setIsBusy(true);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });
      if (!isActiveSession(session) || !picture?.uri) {
        return;
      }

      const encodedUri = getDataUri(picture.base64);
      cameraRef.current = null;
      setSelectedImage({
        displayUri: encodedUri ?? picture.uri,
        uploadUri: encodedUri ?? picture.uri,
        source: 'camera',
      });
      setIsCameraReady(false);
      setStep('preview');
    } catch (error) {
      console.error('Camera capture failed:', error);
      if (isActiveSession(session)) {
        setIssue({
          kind: 'camera-capture',
          canRetry: true,
          message: 'We couldn’t take that photo. Keep the camera open and try again.',
        });
      }
    } finally {
      if (isActiveSession(session)) {
        setIsBusy(false);
      }
      finishOperation(session);
    }
  };

  const handleChooseAnother = () => {
    if (isBusy || isProcessing || !selectedImage) {
      return;
    }

    setIssue(null);
    if (selectedImage.source === 'camera') {
      setSelectedImage(null);
      setIsCameraReady(false);
      setCameraAttempt((attempt) => attempt + 1);
      setStep('camera');
      return;
    }

    void chooseFromGallery();
  };

  const handleUsePhoto = async () => {
    if (!selectedImage) {
      return;
    }

    const session = beginOperation();
    if (session === null) {
      return;
    }

    setIssue(null);
    setIsProcessing(true);

    try {
      const compressed = await compressImage(selectedImage.uploadUri);
      if (!isActiveSession(session)) {
        return;
      }
      finishDialog(() => onImageSelected(compressed));
    } catch (error) {
      console.error('Image compression failed:', error);
      if (isActiveSession(session)) {
        setIssue({
          kind: 'processing',
          canRetry: true,
          message:
            'We couldn’t optimise this image. Please try again or choose a different photo.',
        });
      }
    } finally {
      if (isActiveSession(session)) {
        setIsProcessing(false);
      }
      finishOperation(session);
    }
  };

  const handleRemoveImage = () => {
    if (isBusy || isProcessing) {
      return;
    }
    setIssue(null);
    setStep('remove');
  };

  const confirmRemoveImage = () => {
    if (isBusy || isProcessing) {
      return;
    }
    finishDialog(() => {
      if (onRemove) {
        onRemove();
      } else {
        onImageSelected(null);
      }
    });
  };

  const dialogTitle =
    step === 'preview'
      ? 'Preview photo'
      : step === 'remove'
        ? 'Remove photo?'
        : step === 'permission' || step === 'camera'
          ? 'Take a photo'
          : title;

  const dialogDescription =
    step === 'source'
      ? 'Choose where your photo comes from.'
      : step === 'permission'
        ? CAMERA_PERMISSION_COPY
        : step === 'camera'
          ? 'Position your photo, then tap the shutter when you’re ready.'
          : step === 'remove'
            ? 'This removes the current image. You can add another one later.'
            : undefined;

  const renderIssue = () =>
    issue ? (
      <View style={styles.issue} accessibilityRole="alert">
        <View style={styles.issueIcon}>
          <Feather name="alert-circle" size={18} color={theme.prism.colors.warning} />
        </View>
        <Text style={styles.issueText}>{issue.message}</Text>
      </View>
    ) : null;

  const renderSource = () => (
    <View style={styles.content}>
      {renderIssue()}

      <SourceAction
        label="Choose from gallery"
        description="Select an existing photo"
        icon="upload"
        onPress={() => void chooseFromGallery()}
        disabled={isBusy}
        busy={isBusy && issue?.kind !== 'camera-unavailable'}
      />
      <SourceAction
        label="Take a photo"
        description="Use this device’s camera"
        icon="camera"
        onPress={() => void openCamera()}
        disabled={isBusy}
      />

      {showRemoveOption && currentImage ? (
        <Pressable
          onPress={handleRemoveImage}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.simpleButton,
            styles.removeButton,
            pressed && !isBusy ? styles.pressed : null,
            isBusy ? styles.disabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
        >
          <Feather name="trash-2" size={17} color="#FCA5A5" />
          <Text style={styles.removeLabel}>Remove photo</Text>
        </Pressable>
      ) : null}

      <SecondaryButton label="Cancel" onPress={handleClose} disabled={isBusy} />
    </View>
  );

  const renderPermission = () => (
    <View style={styles.content}>
      <View style={styles.permissionGraphic}>
        {isBusy ? (
          <ActivityIndicator color={theme.prism.colors.accent} size="small" />
        ) : (
          <Feather name="camera" size={26} color={theme.prism.colors.accent} />
        )}
      </View>
      {isBusy ? <Text style={styles.statusText}>Preparing your camera…</Text> : null}
      {renderIssue()}

      {!isBusy && issue?.canRetry ? (
        <SecondaryButton
          label={
            issue.kind === 'camera-permission'
              ? 'Try camera again'
              : issue.kind === 'camera-unavailable'
                ? 'Check camera again'
                : 'Try again'
          }
          onPress={() => void openCamera()}
        />
      ) : null}
      <SecondaryButton
        label="Choose from gallery"
        onPress={() => void chooseFromGallery()}
        disabled={isBusy}
      />
      <TertiaryButton label="Cancel" onPress={handleClose} disabled={isBusy} />
    </View>
  );

  const cameraHasMountError = issue?.kind === 'camera-mount';
  const renderCamera = () => (
    <View style={styles.content}>
      {cameraHasMountError ? (
        <View style={styles.cameraFailure}>
          <View style={styles.permissionGraphic}>
            <Feather name="camera" size={26} color={theme.prism.colors.muted} />
          </View>
          {renderIssue()}
          <SecondaryButton label="Try camera again" onPress={retryMountedCamera} />
          <SecondaryButton label="Choose from gallery" onPress={() => void chooseFromGallery()} />
          <TertiaryButton label="Cancel" onPress={handleClose} />
        </View>
      ) : (
        <>
          <View
            style={[
              styles.cameraFrame,
              imageKind === 'avatar'
                ? styles.squareFrame
                : imageKind === 'banner'
                  ? styles.bannerFrame
                  : styles.attachmentFrame,
            ]}
          >
            <CameraView
              key={`camera-${cameraAttempt}-${facing}`}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mirror={imageKind === 'avatar' && facing === 'front'}
              mode="picture"
              mute
              onCameraReady={() => {
                if (!mountedRef.current || !visibleRef.current) {
                  return;
                }
                setIssue((current) =>
                  current?.kind === 'camera-capture' ? current : null,
                );
                setIsCameraReady(true);
              }}
              onMountError={handleCameraMountError}
            />
            {!isCameraReady ? (
              <View style={styles.cameraLoading}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.cameraLoadingText}>Starting camera…</Text>
              </View>
            ) : null}
          </View>

          {renderIssue()}

          <View style={styles.cameraControls}>
            <Pressable
              onPress={() => void chooseFromGallery()}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.cameraSideButton,
                pressed && !isBusy ? styles.pressed : null,
                isBusy ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
            >
              <Feather name="upload" size={19} color={theme.prism.colors.textSoft} />
              <Text style={styles.cameraSideLabel}>Gallery</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleCapture()}
              disabled={!isCameraReady || isBusy}
              style={({ pressed }) => [
                styles.shutterOuter,
                pressed && isCameraReady && !isBusy ? styles.shutterPressed : null,
                !isCameraReady || isBusy ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
              accessibilityState={{ disabled: !isCameraReady || isBusy, busy: isBusy }}
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>

            <Pressable
              onPress={handleFlipCamera}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.cameraSideButton,
                pressed && !isBusy ? styles.pressed : null,
                isBusy ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Text style={styles.flipGlyph} accessibilityElementsHidden>↻</Text>
              <Text style={styles.cameraSideLabel}>Flip</Text>
            </Pressable>
          </View>

          {issue?.kind === 'camera-capture' ? (
            <SecondaryButton
              label="Try capture again"
              onPress={() => void handleCapture()}
              disabled={!isCameraReady || isBusy}
            />
          ) : null}
          <TertiaryButton label="Cancel" onPress={handleClose} disabled={isBusy} />
        </>
      )}
    </View>
  );

  const renderPreview = () => (
    <View style={styles.content}>
      <View
        style={[
          styles.previewFrame,
          imageKind === 'avatar'
            ? styles.squareFrame
            : imageKind === 'banner'
              ? styles.bannerFrame
              : styles.attachmentFrame,
        ]}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage.displayUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={imageKind === 'attachment' ? 'contain' : 'cover'}
            accessibilityLabel="Selected image preview"
          />
        ) : null}
      </View>

      {renderIssue()}

      <View style={styles.previewActions}>
        <SecondaryButton
          label={selectedImage?.source === 'camera' ? 'Retake' : 'Choose another'}
          onPress={handleChooseAnother}
          disabled={isProcessing}
          compact
        />
        <GradientButton
          label={isProcessing ? 'Optimising…' : 'Use photo'}
          onPress={() => void handleUsePhoto()}
          disabled={isProcessing || !selectedImage}
          busy={isProcessing}
        />
      </View>
      <TertiaryButton label="Cancel" onPress={handleClose} disabled={isProcessing} />
    </View>
  );

  const renderRemoveConfirmation = () => (
    <View style={styles.content}>
      <View style={styles.removeGraphic}>
        <Feather name="trash-2" size={24} color="#FCA5A5" />
      </View>
      <View style={styles.previewActions}>
        <SecondaryButton
          label="Keep photo"
          onPress={() => setStep('source')}
          compact
        />
        <Pressable
          onPress={confirmRemoveImage}
          style={({ pressed }) => [
            styles.actionButton,
            styles.destructiveButton,
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
        >
          <Text style={styles.actionLabel}>Remove photo</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <AppDialog
      visible={visible}
      onRequestClose={handleClose}
      title={dialogTitle}
      description={dialogDescription}
      dismissOnBackdrop={!isBusy && !isProcessing && step !== 'camera'}
      maxWidth={step === 'camera' || step === 'preview' ? 520 : 430}
      accessibilityLabel={`${dialogTitle} dialog`}
    >
      {step === 'source'
        ? renderSource()
        : step === 'permission'
          ? renderPermission()
          : step === 'camera'
            ? renderCamera()
            : step === 'preview'
              ? renderPreview()
              : renderRemoveConfirmation()}
    </AppDialog>
  );
};

type SourceActionProps = {
  label: string;
  description: string;
  icon: 'upload' | 'camera';
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
};

const SourceAction: React.FC<SourceActionProps> = ({
  label,
  description,
  icon,
  onPress,
  disabled = false,
  busy = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.sourceAction,
      pressed && !disabled ? styles.sourceActionPressed : null,
      disabled ? styles.disabled : null,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={description}
    accessibilityState={{ disabled, busy }}
  >
    <LinearGradient
      colors={theme.prism.gradients.surface}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.sourceIcon}
      pointerEvents="none"
    >
      {busy ? (
        <ActivityIndicator color={theme.prism.colors.accent} size="small" />
      ) : (
        <Feather name={icon} size={20} color={theme.prism.colors.accent} />
      )}
    </LinearGradient>
    <View style={styles.sourceCopy} pointerEvents="none">
      <Text style={styles.sourceLabel}>{label}</Text>
      <Text style={styles.sourceDescription}>{description}</Text>
    </View>
    <Feather name="chevron-right" size={19} color={theme.prism.colors.muted} />
  </Pressable>
);

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
};

const SecondaryButton: React.FC<ButtonProps> = ({
  label,
  onPress,
  disabled = false,
  compact = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.actionButton,
      styles.secondaryButton,
      compact ? styles.compactButton : null,
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
  >
    <Text style={styles.secondaryLabel}>{label}</Text>
  </Pressable>
);

const TertiaryButton: React.FC<ButtonProps> = ({ label, onPress, disabled = false }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.tertiaryButton,
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
  >
    <Text style={styles.tertiaryLabel}>{label}</Text>
  </Pressable>
);

const GradientButton: React.FC<ButtonProps> = ({
  label,
  onPress,
  disabled = false,
  busy = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.actionButton,
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled, busy }}
  >
    <LinearGradient
      colors={theme.prism.gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientFill}
      pointerEvents="none"
    >
      {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
      <Text style={styles.actionLabel}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  sourceAction: {
    minHeight: 68,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: 'rgba(11, 17, 24, 0.88)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceActionPressed: {
    borderColor: theme.prism.colors.borderStrong,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
  },
  sourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  sourceCopy: {
    flex: 1,
    gap: 2,
  },
  sourceLabel: {
    color: theme.prism.colors.text,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.typography.weight.semibold,
  },
  sourceDescription: {
    color: theme.prism.colors.muted,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 12,
    lineHeight: 17,
  },
  simpleButton: {
    minHeight: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.34)',
    backgroundColor: 'rgba(127, 29, 29, 0.12)',
  },
  removeLabel: {
    color: '#FCA5A5',
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 14,
    fontWeight: theme.typography.weight.semibold,
  },
  issue: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(120, 53, 15, 0.15)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  issueIcon: {
    paddingTop: 1,
  },
  issueText: {
    flex: 1,
    color: '#FDE68A',
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 13,
    lineHeight: 19,
  },
  permissionGraphic: {
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.26)',
  },
  statusText: {
    color: theme.prism.colors.textSoft,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 13,
    textAlign: 'center',
  },
  cameraFailure: {
    gap: 12,
  },
  cameraFrame: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: theme.radii.lg,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: theme.prism.colors.borderStrong,
  },
  squareFrame: {
    aspectRatio: 1,
    maxWidth: 360,
  },
  bannerFrame: {
    aspectRatio: 2,
  },
  attachmentFrame: {
    aspectRatio: 4 / 3,
  },
  cameraLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.74)',
  },
  cameraLoadingText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 13,
    fontWeight: theme.typography.weight.medium,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  cameraSideButton: {
    width: 72,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: theme.radii.md,
  },
  cameraSideLabel: {
    color: theme.prism.colors.textSoft,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 11,
    fontWeight: theme.typography.weight.semibold,
  },
  flipGlyph: {
    color: theme.prism.colors.textSoft,
    fontSize: 24,
    lineHeight: 24,
  },
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  previewFrame: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: theme.radii.lg,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    minWidth: 0,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.prism.colors.border,
    backgroundColor: theme.prism.colors.cardDeep,
  },
  secondaryLabel: {
    color: theme.prism.colors.textSoft,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 14,
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
  },
  gradientFill: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 14,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  destructiveButton: {
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.65)',
    backgroundColor: '#B91C1C',
  },
  tertiaryButton: {
    minHeight: 42,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryLabel: {
    color: theme.prism.colors.muted,
    fontFamily: theme.typography.fontFamily.web,
    fontSize: 14,
    fontWeight: theme.typography.weight.semibold,
  },
  removeGraphic: {
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.34)',
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ImageUploadDialog;
