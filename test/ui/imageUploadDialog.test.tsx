import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, StyleSheet, View } from 'react-native';

const mockIsCameraAvailable = jest.fn();
const mockRequestCameraPermission = jest.fn();
const mockTakePicture = jest.fn();
const mockGetCameraSwitchAvailability = jest.fn();
const mockUploadImageFromUri = jest.fn();
const mockDeleteStoredImage = jest.fn();
const mockPreviewFetch = jest.fn();
const mockCreateObjectURL = jest.fn();
const CAMERA_PREVIEW_BLOB_URI = 'blob:https://zenlit.test/camera-preview';
const originalFetch = globalThis.fetch;
const originalCreateObjectURL = globalThis.URL.createObjectURL;
let mockCameraProps: Record<string, unknown> | null = null;
let mockCameraPermission: Record<string, unknown> | null = null;

jest.mock('../../src/components/ui/app-dialog', () => {
  const ReactRuntime = require('react');
  const { Text, View } = require('react-native');

  const MockAppDialog = ({
    visible,
    title,
    description,
    onRequestClose,
    dismissOnBackdrop = true,
    children,
  }: {
    visible: boolean;
    title?: string;
    description?: string;
    onRequestClose?: () => void;
    dismissOnBackdrop?: boolean;
    children?: React.ReactNode;
  }) =>
    visible
      ? ReactRuntime.createElement(
          View,
          { accessibilityLabel: 'Mock app dialog' },
          title ? ReactRuntime.createElement(Text, null, title) : null,
          description ? ReactRuntime.createElement(Text, null, description) : null,
          dismissOnBackdrop
            ? ReactRuntime.createElement(
                require('react-native').Pressable,
                { accessibilityLabel: 'Dismiss dialog', onPress: onRequestClose },
              )
            : null,
          children,
        )
      : null;

  return { __esModule: true, default: MockAppDialog };
});

jest.mock('../../src/services/storageService', () => ({
  uploadImageFromUri: (...args: unknown[]) => mockUploadImageFromUri(...args),
  deleteStoredImage: (...args: unknown[]) => mockDeleteStoredImage(...args),
}));

jest.mock('../../src/utils/camera-switch-availability', () => ({
  getCameraSwitchAvailability: (...args: unknown[]) =>
    mockGetCameraSwitchAvailability(...args),
}));

import * as ImagePicker from 'expo-image-picker';
import ImageUploadDialog, {
  type ImageKind,
  type ImageUploadDialogProps,
} from '../../src/components/ImageUploadDialog';
import { VALID_2X2_JPEG_DATA_URI } from '../fixtures/imageFixtures';

const MockCameraView = React.forwardRef<any, any>((props, ref) => {
  mockCameraProps = props;
  React.useImperativeHandle(ref, () => ({
    takePictureAsync: mockTakePicture,
  }));

  return (
    <View testID="camera-preview">
      <Pressable accessibilityLabel="Mark camera ready" onPress={props.onCameraReady} />
      <Pressable
        accessibilityLabel="Fail camera mount"
        onPress={() => props.onMountError?.({ message: 'Device is busy' })}
      />
    </View>
  );
});
MockCameraView.displayName = 'MockCameraView';
(MockCameraView as typeof MockCameraView & { isAvailableAsync: typeof mockIsCameraAvailable })
  .isAvailableAsync = mockIsCameraAvailable;

const mockedCameraModule = jest.requireMock('expo-camera') as {
  CameraView: typeof MockCameraView;
  useCameraPermissions: () => [
    Record<string, unknown> | null,
    typeof mockRequestCameraPermission,
  ];
};

const grantedPermission: ImagePicker.MediaLibraryPermissionResponse = {
  status: 'granted' as ImagePicker.PermissionStatus,
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

const deniedPermission: ImagePicker.MediaLibraryPermissionResponse = {
  status: 'denied' as ImagePicker.PermissionStatus,
  granted: false,
  canAskAgain: true,
  expires: 'never',
};

const permanentlyDeniedPermission: ImagePicker.MediaLibraryPermissionResponse = {
  ...deniedPermission,
  canAskAgain: false,
};

const storedImage = {
  uploadId: 'upload-1',
  publicUrl: 'https://project.supabase.co/storage/v1/object/public/profile-images/user/avatar.jpg',
  bucket: 'profile-images' as const,
  objectPath: 'user/avatar.jpg',
  width: 640,
  height: 640,
  size: 1000,
  mimeType: 'image/jpeg' as const,
};

const getImagePickerMocks = () =>
  ImagePicker as jest.Mocked<typeof ImagePicker>;

const renderDialog = (
  overrides: Partial<ImageUploadDialogProps> = {},
  imageKind: ImageKind = 'avatar',
) => {
  const props: ImageUploadDialogProps = {
    visible: true,
    imageKind,
    title: 'Profile picture',
    onClose: jest.fn(),
    uploadTarget: { bucket: 'profile-images', prefix: 'avatar' },
    onImageUploaded: jest.fn(),
    ...overrides,
  };

  return { ...render(<ImageUploadDialog {...props} />), props };
};

describe('ImageUploadDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadImageFromUri.mockReset();
    mockPreviewFetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['camera jpeg'], { type: 'image/jpeg' })),
    });
    mockCreateObjectURL.mockReturnValue(CAMERA_PREVIEW_BLOB_URI);
    globalThis.fetch = mockPreviewFetch as typeof globalThis.fetch;
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    mockedCameraModule.CameraView = MockCameraView;
    mockedCameraModule.useCameraPermissions = () => [
      mockCameraPermission,
      mockRequestCameraPermission,
    ];
    mockCameraProps = null;
    mockCameraPermission = null;
    mockIsCameraAvailable.mockResolvedValue(true);
    mockRequestCameraPermission.mockResolvedValue(grantedPermission);
    mockGetCameraSwitchAvailability.mockResolvedValue(false);
    mockTakePicture.mockResolvedValue({
      uri: VALID_2X2_JPEG_DATA_URI,
      width: 2,
      height: 2,
      format: 'jpg',
    });
    mockUploadImageFromUri.mockResolvedValue({ image: storedImage, error: null });
    mockDeleteStoredImage.mockResolvedValue({ success: true, error: null });
    getImagePickerMocks().requestMediaLibraryPermissionsAsync.mockResolvedValue(
      grantedPermission,
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    });
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
  });

  it('shows the exact source actions and optional remove action', () => {
    const screen = renderDialog({
      currentImage: 'https://example.com/avatar.jpg',
      showRemoveOption: true,
    });

    expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
    expect(screen.getByLabelText('Take a photo')).toBeTruthy();
    expect(screen.getByLabelText('Remove photo')).toBeTruthy();
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    expect(getImagePickerMocks().requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['avatar', true, [1, 1]],
    ['banner', false, undefined],
    ['attachment', false, undefined],
  ] as const)(
    'uses purpose-specific gallery options for %s images',
    async (imageKind, allowsEditing, aspect) => {
      getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file://gallery.jpg',
            width: 1200,
            height: 800,
            type: 'image',
            fileName: 'gallery.jpg',
            fileSize: 1000,
            mimeType: 'image/jpeg',
            base64: null,
            assetId: null,
            duration: null,
            exif: null,
            pairedVideoAsset: null,
          },
        ],
      });
      const screen = renderDialog({}, imageKind);

      fireEvent.press(screen.getByLabelText('Choose from gallery'));

      await waitFor(() =>
        expect(getImagePickerMocks().launchImageLibraryAsync).toHaveBeenCalledTimes(1),
      );
      expect(getImagePickerMocks().launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsEditing, base64: false }),
      );
      const pickerOptions = getImagePickerMocks().launchImageLibraryAsync.mock.calls[0][0]!;
      expect(pickerOptions.aspect).toEqual(aspect);
      expect(screen.getByLabelText('Selected image preview')).toBeTruthy();
      expect(screen.getByLabelText('Choose another')).toBeTruthy();
      if (imageKind === 'attachment') {
        expect(
          StyleSheet.flatten(screen.getByTestId('selected-image-frame').props.style)
            .aspectRatio,
        ).toBe(1200 / 800);
      }
    },
  );

  it('shows an inline gallery permission failure instead of a native alert', async () => {
    getImagePickerMocks().requestMediaLibraryPermissionsAsync.mockResolvedValue(
      permanentlyDeniedPermission,
    );
    const screen = renderDialog();

    fireEvent.press(screen.getByLabelText('Choose from gallery'));

    expect(
      await screen.findByText(
        'Photo access is blocked. Update your browser or device settings, then try again.',
      ),
    ).toBeTruthy();
    expect(getImagePickerMocks().launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('revokes a temporary gallery Blob URL when the dialog is cancelled', async () => {
    const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
    const revokeObjectURL = jest.fn();
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'blob:https://zenlit.test/gallery-preview',
          width: 200,
          height: 200,
          type: 'image',
          fileName: 'gallery.jpg',
          fileSize: 100,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });

    try {
      const screen = renderDialog();
      fireEvent.press(screen.getByLabelText('Choose from gallery'));
      await screen.findByLabelText('Selected image preview');
      fireEvent.press(screen.getByLabelText('Cancel'));

      expect(revokeObjectURL).toHaveBeenCalledWith(
        'blob:https://zenlit.test/gallery-preview',
      );
    } finally {
      globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('requests camera permission lazily and opens a mirrored front camera for avatars', async () => {
    const screen = renderDialog();

    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Take a photo'));

    await screen.findByTestId('camera-preview');
    expect(mockIsCameraAvailable).toHaveBeenCalledTimes(1);
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
    expect(mockGetCameraSwitchAvailability).toHaveBeenCalledTimes(1);
    expect(mockCameraProps).toEqual(
      expect.objectContaining({ facing: 'front', mirror: true, mode: 'picture', mute: true }),
    );
    expect(screen.getByLabelText('Capture photo').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    expect(screen.getByLabelText('Capture photo').props.accessibilityState.disabled).toBe(false);
  });

  it('checks switch availability only after camera permission is granted', async () => {
    let resolvePermission: (permission: typeof grantedPermission) => void = () => undefined;
    mockRequestCameraPermission.mockReturnValue(
      new Promise<typeof grantedPermission>((resolve) => {
        resolvePermission = resolve;
      }),
    );
    const screen = renderDialog();

    expect(mockGetCameraSwitchAvailability).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Take a photo'));

    await waitFor(() => expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1));
    expect(mockGetCameraSwitchAvailability).not.toHaveBeenCalled();

    resolvePermission(grantedPermission);

    await screen.findByTestId('camera-preview');
    expect(mockGetCameraSwitchAvailability).toHaveBeenCalledTimes(1);
  });

  it('ignores switch availability that resolves after the dialog closes', async () => {
    let resolveAvailability: (available: boolean) => void = () => undefined;
    mockGetCameraSwitchAvailability.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveAvailability = resolve;
      }),
    );
    const screen = renderDialog();

    fireEvent.press(screen.getByLabelText('Take a photo'));
    await waitFor(() =>
      expect(mockGetCameraSwitchAvailability).toHaveBeenCalledTimes(1),
    );

    screen.rerender(<ImageUploadDialog {...screen.props} visible={false} />);
    await act(async () => {
      resolveAvailability(true);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('camera-preview')).toBeNull();
    expect(screen.queryByLabelText('Switch camera')).toBeNull();
    expect(screen.queryByTestId('camera-switch-placeholder')).toBeNull();
  });

  it('shows Switch on a mobile device with front and rear cameras and toggles facing', async () => {
    mockGetCameraSwitchAvailability.mockResolvedValue(true);
    const screen = renderDialog();

    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');

    expect(screen.getByText('Gallery')).toBeTruthy();
    expect(screen.getByLabelText('Capture photo')).toBeTruthy();
    expect(screen.getByText('Switch')).toBeTruthy();
    expect(screen.getByLabelText('Switch camera')).toBeTruthy();
    expect(screen.queryByTestId('camera-switch-placeholder')).toBeNull();
    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'front' }));

    fireEvent.press(screen.getByLabelText('Switch camera'));

    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'back' }));
  });

  it.each([
    ['desktop web', false],
    ['mobile web with one camera', false],
  ])(
    'hides Switch on %s while preserving gallery, shutter, and the centered spacer',
    async (_environment, availability) => {
      mockGetCameraSwitchAvailability.mockResolvedValue(availability);
      const screen = renderDialog();

      fireEvent.press(screen.getByLabelText('Take a photo'));
      await screen.findByTestId('camera-preview');

      expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
      expect(screen.getByLabelText('Capture photo')).toBeTruthy();
      expect(screen.queryByLabelText('Switch camera')).toBeNull();
      expect(screen.queryByText('Switch')).toBeNull();
      expect(screen.getByTestId('camera-switch-placeholder')).toBeTruthy();
    },
  );

  it('uses the rear camera for banners, then unmounts it and previews before upload', async () => {
    mockGetCameraSwitchAvailability.mockResolvedValue(true);
    const screen = renderDialog({}, 'banner');
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');

    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'back', mirror: false }));
    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Switch camera'));
    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'front', mirror: false }));

    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Capture photo'));

    expect(await screen.findByLabelText('Selected image preview')).toBeTruthy();
    expect(screen.queryByTestId('camera-preview')).toBeNull();
    expect(mockTakePicture).toHaveBeenCalledTimes(1);
    expect(mockTakePicture).toHaveBeenCalledWith({
      quality: 0.9,
      imageType: 'jpg',
      isImageMirror: false,
    });
    expect(screen.getByLabelText('Retake')).toBeTruthy();
    expect(screen.getByLabelText('Upload photo')).toBeTruthy();
    expect(screen.queryByLabelText('Choose another')).toBeNull();
    expect(screen.queryByLabelText('Use photo')).toBeNull();
    expect(mockUploadImageFromUri).not.toHaveBeenCalled();
    expect(screen.props.onImageUploaded).not.toHaveBeenCalled();
    expect(screen.props.onClose).not.toHaveBeenCalled();
  });

  it('uploads a mirrored camera preview exactly once only after Upload photo is pressed', async () => {
    let resolveUpload: (value: { image: typeof storedImage; error: null }) => void =
      () => undefined;
    mockUploadImageFromUri.mockReturnValue(
      new Promise<{ image: typeof storedImage; error: null }>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');
    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Capture photo'));

    await waitFor(() => expect(mockTakePicture).toHaveBeenCalledTimes(1));
    const captureOptions = mockTakePicture.mock.calls[0][0];
    expect(captureOptions).toEqual({
      quality: 0.9,
      imageType: 'jpg',
      isImageMirror: true,
    });
    expect(captureOptions).not.toHaveProperty('base64');
    expect(await screen.findByLabelText('Selected image preview')).toBeTruthy();
    expect(mockUploadImageFromUri).not.toHaveBeenCalled();

    const uploadPhoto = screen.getByLabelText('Upload photo');
    fireEvent.press(uploadPhoto);
    fireEvent.press(uploadPhoto);

    expect(await screen.findByText('Preparing photo…')).toBeTruthy();
    expect(mockUploadImageFromUri).toHaveBeenCalledTimes(1);
    expect(mockUploadImageFromUri).toHaveBeenCalledWith(
      CAMERA_PREVIEW_BLOB_URI,
      { bucket: 'profile-images', prefix: 'avatar' },
      expect.objectContaining({
        source: 'camera',
        width: 2,
        height: 2,
        onProgress: expect.any(Function),
      }),
    );
    resolveUpload({ image: storedImage, error: null });

    await waitFor(() => expect(screen.props.onImageUploaded).toHaveBeenCalledWith(storedImage));
    expect(screen.props.onImageUploaded).toHaveBeenCalledTimes(1);
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('revokes the temporary camera capture and reopens the camera when Retake is pressed', async () => {
    const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
    const revokeObjectURL = jest.fn();
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    mockTakePicture.mockResolvedValue({
      uri: 'blob:https://zenlit.test/camera-retake',
      width: 1200,
      height: 1200,
      format: 'jpg',
    });

    try {
      const screen = renderDialog();
      fireEvent.press(screen.getByLabelText('Take a photo'));
      await screen.findByTestId('camera-preview');
      fireEvent.press(screen.getByLabelText('Mark camera ready'));
      fireEvent.press(screen.getByLabelText('Capture photo'));

      expect(await screen.findByLabelText('Selected image preview')).toBeTruthy();
      expect(screen.queryByTestId('camera-preview')).toBeNull();
      expect(mockUploadImageFromUri).not.toHaveBeenCalled();
      fireEvent.press(screen.getByLabelText('Retake'));

      expect(revokeObjectURL).toHaveBeenCalledWith(
        'blob:https://zenlit.test/camera-retake',
      );
      expect(await screen.findByTestId('camera-preview')).toBeTruthy();
      expect(screen.queryByLabelText('Selected image preview')).toBeNull();
      expect(screen.queryByLabelText('Upload photo')).toBeNull();
      expect(mockUploadImageFromUri).not.toHaveBeenCalled();
      expect(screen.props.onImageUploaded).not.toHaveBeenCalled();
      expect(screen.props.onClose).not.toHaveBeenCalled();
    } finally {
      globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it.each([
    ['Cancel', 'Cancel'],
    ['backdrop dismissal', 'Dismiss dialog'],
  ])(
    'revokes an unuploaded camera capture on %s',
    async (_action, actionLabel) => {
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      const revokeObjectURL = jest.fn();
      globalThis.URL.revokeObjectURL = revokeObjectURL;
      mockTakePicture.mockResolvedValue({
        uri: 'blob:https://zenlit.test/camera-cancel',
        width: 1200,
        height: 1200,
        format: 'jpg',
      });

      try {
        const screen = renderDialog();
        fireEvent.press(screen.getByLabelText('Take a photo'));
        await screen.findByTestId('camera-preview');
        fireEvent.press(screen.getByLabelText('Mark camera ready'));
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await screen.findByLabelText('Selected image preview');

        fireEvent.press(screen.getByLabelText(actionLabel));

        expect(revokeObjectURL).toHaveBeenCalledWith(
          'blob:https://zenlit.test/camera-cancel',
        );
        expect(mockUploadImageFromUri).not.toHaveBeenCalled();
        expect(screen.props.onImageUploaded).not.toHaveBeenCalled();
        expect(screen.props.onClose).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    },
  );

  it('unmounts the live camera and closes exactly once when cancelled', async () => {
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');
    fireEvent.press(screen.getByLabelText('Mark camera ready'));

    fireEvent.press(screen.getByLabelText('Cancel'));

    expect(screen.queryByTestId('camera-preview')).toBeNull();
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [deniedPermission, true],
    [permanentlyDeniedPermission, false],
  ])(
    'keeps a gallery fallback when camera permission is denied',
    async (permission, shouldRetry) => {
      mockRequestCameraPermission.mockResolvedValue(permission);
      const screen = renderDialog();

      fireEvent.press(screen.getByLabelText('Take a photo'));

      await screen.findByText(
        permission.canAskAgain
          ? 'Allow camera access to take a photo. Zenlit never requests microphone access.'
          : 'Camera access is blocked. Update your browser or device settings, then return here.',
      );
      expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
      expect(screen.queryByLabelText('Try camera again') !== null).toBe(shouldRetry);
      expect(screen.queryByTestId('camera-preview')).toBeNull();
      expect(mockGetCameraSwitchAvailability).not.toHaveBeenCalled();
    },
  );

  it('handles an unavailable camera inline with retry and gallery fallback', async () => {
    mockIsCameraAvailable.mockResolvedValue(false);
    const screen = renderDialog();

    fireEvent.press(screen.getByLabelText('Take a photo'));

    expect(
      await screen.findByText(
        'We couldn’t find a camera on this device. You can still choose a photo from your gallery.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Check camera again')).toBeTruthy();
    expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });

  it('unmounts a failed camera preview and can retry mounting it', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');

    fireEvent.press(screen.getByLabelText('Fail camera mount'));

    expect(screen.queryByTestId('camera-preview')).toBeNull();
    expect(
      screen.getByText(
        'We couldn’t start the camera preview. Check that another app isn’t using it, then try again.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Try camera again'));
    expect(await screen.findByTestId('camera-preview')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('keeps the live camera and gallery fallback after a capture failure', async () => {
    mockTakePicture.mockRejectedValue(new Error('capture failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');
    fireEvent.press(screen.getByLabelText('Mark camera ready'));

    fireEvent.press(screen.getByLabelText('Capture photo'));

    expect(
      await screen.findByText(
        'We couldn’t take that photo. Keep the camera open and try again.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('camera-preview')).toBeTruthy();
    expect(screen.getByLabelText('Try capture again')).toBeTruthy();
    expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('uploads and completes exactly once when Use photo is pressed repeatedly', async () => {
    let resolveUpload: (value: { image: typeof storedImage; error: null }) => void =
      () => undefined;
    mockUploadImageFromUri.mockReturnValue(
      new Promise<{ image: typeof storedImage; error: null }>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://gallery.jpg',
          width: 100,
          height: 100,
          type: 'image',
          fileName: 'gallery.jpg',
          fileSize: 100,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');

    const usePhoto = screen.getByLabelText('Use photo');
    fireEvent.press(usePhoto);
    fireEvent.press(usePhoto);
    expect(await screen.findByText('Preparing photo…')).toBeTruthy();
    resolveUpload({ image: storedImage, error: null });

    await waitFor(() => expect(screen.props.onImageUploaded).toHaveBeenCalledTimes(1));
    expect(mockUploadImageFromUri).toHaveBeenCalledTimes(1);
    expect(mockUploadImageFromUri).toHaveBeenCalledWith(
      'file://gallery.jpg',
      { bucket: 'profile-images', prefix: 'avatar' },
      expect.objectContaining({
        source: 'gallery',
        width: 100,
        height: 100,
        onProgress: expect.any(Function),
      }),
    );
    expect(screen.props.onImageUploaded).toHaveBeenCalledWith(storedImage);
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows preparing and uploading progress before returning the public URL', async () => {
    const uploadDeferred: {
      resolve: (value: { image: typeof storedImage; error: null }) => void;
    } = { resolve: () => undefined };
    mockUploadImageFromUri.mockImplementation(
      async (
        _uri: string,
        _target: unknown,
        options: { onProgress: (phase: 'preparing' | 'uploading') => void },
      ) => {
        options.onProgress('preparing');
        await Promise.resolve();
        options.onProgress('uploading');
        return new Promise<{ image: typeof storedImage; error: null }>((resolve) => {
          uploadDeferred.resolve = resolve;
        });
      },
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://gallery.jpg',
          width: 100,
          height: 100,
          type: 'image',
          fileName: null,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');

    fireEvent.press(screen.getByLabelText('Use photo'));

    expect(await screen.findByText('Uploading photo…')).toBeTruthy();
    uploadDeferred.resolve({ image: storedImage, error: null });
    await waitFor(() => expect(screen.props.onImageUploaded).toHaveBeenCalledWith(storedImage));
  });

  it('waits for async image adoption before closing the dialog', async () => {
    let finishAdoption: () => void = () => undefined;
    const onImageUploaded = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishAdoption = resolve;
        }),
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://gallery.jpg',
          width: 100,
          height: 100,
          type: 'image',
          fileName: null,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    const screen = renderDialog({ onImageUploaded });
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');
    fireEvent.press(screen.getByLabelText('Use photo'));

    await waitFor(() => expect(onImageUploaded).toHaveBeenCalledWith(storedImage));
    expect(screen.props.onClose).not.toHaveBeenCalled();
    finishAdoption();
    await waitFor(() => expect(screen.props.onClose).toHaveBeenCalledTimes(1));
  });

  it('shows processing errors inline and allows a retry', async () => {
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://gallery.jpg',
          width: 100,
          height: 100,
          type: 'image',
          fileName: null,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    mockUploadImageFromUri.mockResolvedValueOnce({
      image: null,
      error: new Error('compress failed'),
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');

    fireEvent.press(screen.getByLabelText('Use photo'));

    expect(
      await screen.findByText(
        'We couldn’t prepare this photo. Please try again or choose another photo.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();
    expect(screen.props.onImageUploaded).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('previews a complete Expo web camera URI before attempting its confirmed upload', async () => {
    mockTakePicture.mockResolvedValue({
      uri: VALID_2X2_JPEG_DATA_URI,
      base64: VALID_2X2_JPEG_DATA_URI,
      width: 2,
      height: 2,
      format: 'jpg',
    });
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://gallery-fallback.jpg',
          width: 900,
          height: 1200,
          type: 'image',
          fileName: 'gallery-fallback.jpg',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    mockUploadImageFromUri.mockImplementationOnce(
      async (
        _uri: string,
        _target: unknown,
        options: { onProgress: (phase: 'preparing' | 'uploading') => void },
      ) => {
        options.onProgress('uploading');
        return { image: null, error: new Error('upload failed') };
      },
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog({}, 'attachment');
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');
    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Capture photo'));

    expect(await screen.findByLabelText('Selected image preview')).toBeTruthy();
    expect(mockUploadImageFromUri).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Retake')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Upload photo'));

    await screen.findByText(
      'We couldn’t upload this photo. Please try again or choose another photo.',
    );
    expect(mockUploadImageFromUri).toHaveBeenCalledWith(
      CAMERA_PREVIEW_BLOB_URI,
      { bucket: 'profile-images', prefix: 'avatar' },
      expect.objectContaining({ source: 'camera', width: 2, height: 2 }),
    );
    expect(mockPreviewFetch).toHaveBeenCalledWith(VALID_2X2_JPEG_DATA_URI);
    expect(mockUploadImageFromUri.mock.calls[0][0]).not.toContain(
      'data:image/jpeg;base64,data:',
    );
    expect(mockTakePicture).toHaveBeenCalledWith({
      quality: 0.9,
      imageType: 'jpg',
      isImageMirror: false,
    });
    expect(screen.getByLabelText('Retake')).toBeTruthy();
    expect(screen.getByLabelText('Cancel')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Retake'));

    expect(await screen.findByTestId('camera-preview')).toBeTruthy();
    expect(getImagePickerMocks().launchImageLibraryAsync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('confirms removal in-app and calls removal only once', () => {
    const onRemove = jest.fn();
    const screen = renderDialog({
      currentImage: 'https://example.com/avatar.jpg',
      showRemoveOption: true,
      onRemove,
    });

    fireEvent.press(screen.getByLabelText('Remove photo'));
    expect(screen.getByText('Remove photo?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove photo'));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.props.onImageUploaded).not.toHaveBeenCalled();
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores a late gallery result after the dialog is hidden', async () => {
    let resolvePicker: (value: ImagePicker.ImagePickerResult) => void = () => undefined;
    getImagePickerMocks().launchImageLibraryAsync.mockReturnValue(
      new Promise<ImagePicker.ImagePickerResult>((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const onImageUploaded = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <ImageUploadDialog
        visible
        imageKind="attachment"
        uploadTarget={{ bucket: 'post-images', prefix: 'post' }}
        onImageUploaded={onImageUploaded}
        onClose={onClose}
      />,
    );
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await waitFor(() =>
      expect(getImagePickerMocks().launchImageLibraryAsync).toHaveBeenCalledTimes(1),
    );

    screen.rerender(
      <ImageUploadDialog
        visible={false}
        imageKind="attachment"
        uploadTarget={{ bucket: 'post-images', prefix: 'post' }}
        onImageUploaded={onImageUploaded}
        onClose={onClose}
      />,
    );
    resolvePicker({
      canceled: false,
      assets: [
        {
          uri: 'file://late.jpg',
          width: 100,
          height: 100,
          type: 'image',
          fileName: null,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });

    await waitFor(() => expect(onImageUploaded).not.toHaveBeenCalled());
    expect(screen.queryByLabelText('Selected image preview')).toBeNull();
  });

  it('deletes an upload that finishes after the dialog is dismissed', async () => {
    let resolveUpload: (value: { image: typeof storedImage; error: null }) => void =
      () => undefined;
    mockUploadImageFromUri.mockReturnValue(
      new Promise<{ image: typeof storedImage; error: null }>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://late-upload.jpg',
          width: 200,
          height: 100,
          type: 'image',
          fileName: 'late-upload.jpg',
          fileSize: 100,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    const onImageUploaded = jest.fn();
    const screen = render(
      <ImageUploadDialog
        visible
        imageKind="attachment"
        uploadTarget={{ bucket: 'post-images', prefix: 'post' }}
        onImageUploaded={onImageUploaded}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');
    fireEvent.press(screen.getByLabelText('Use photo'));
    await screen.findByText('Preparing photo…');

    screen.rerender(
      <ImageUploadDialog
        visible={false}
        imageKind="attachment"
        uploadTarget={{ bucket: 'post-images', prefix: 'post' }}
        onImageUploaded={onImageUploaded}
        onClose={jest.fn()}
      />,
    );
    resolveUpload({ image: storedImage, error: null });

    await waitFor(() => expect(mockDeleteStoredImage).toHaveBeenCalledWith(storedImage));
    expect(onImageUploaded).not.toHaveBeenCalled();
  });

  it('deletes an uploaded object when the parent cannot adopt it', async () => {
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://callback-failure.jpg',
          width: 200,
          height: 200,
          type: 'image',
          fileName: 'callback-failure.jpg',
          fileSize: 100,
          mimeType: 'image/jpeg',
          base64: null,
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog({
      onImageUploaded: jest.fn(async () => {
        throw new Error('parent rejected image');
      }),
    });

    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');
    fireEvent.press(screen.getByLabelText('Use photo'));

    await waitFor(() => expect(mockDeleteStoredImage).toHaveBeenCalledWith(storedImage));
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

});
