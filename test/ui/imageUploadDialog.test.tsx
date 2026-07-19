import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, StyleSheet, View } from 'react-native';

const mockIsCameraAvailable = jest.fn();
const mockRequestCameraPermission = jest.fn();
const mockTakePicture = jest.fn();
const mockCompressImage = jest.fn();
let mockCameraProps: Record<string, unknown> | null = null;
let mockCameraPermission: Record<string, unknown> | null = null;

jest.mock('../../src/components/ui/app-dialog', () => {
  const ReactRuntime = require('react');
  const { Text, View } = require('react-native');

  const MockAppDialog = ({
    visible,
    title,
    description,
    children,
  }: {
    visible: boolean;
    title?: string;
    description?: string;
    children?: React.ReactNode;
  }) =>
    visible
      ? ReactRuntime.createElement(
          View,
          { accessibilityLabel: 'Mock app dialog' },
          title ? ReactRuntime.createElement(Text, null, title) : null,
          description ? ReactRuntime.createElement(Text, null, description) : null,
          children,
        )
      : null;

  return { __esModule: true, default: MockAppDialog };
});

jest.mock('../../src/utils/imageCompression', () => ({
  compressImage: (...args: unknown[]) => mockCompressImage(...args),
}));

import * as ImagePicker from 'expo-image-picker';
import ImageUploadDialog, {
  type ImageKind,
  type ImageUploadDialogProps,
} from '../../src/components/ImageUploadDialog';

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

const compressedImage = {
  uri: 'file://compressed.jpg',
  width: 640,
  height: 640,
  size: 1000,
  mimeType: 'image/jpeg',
  metadata: {
    originalSize: 2000,
    compressedSize: 1000,
    compressionRatio: 0.5,
    iterations: 1,
    quality: 0.9,
    resized: false,
    targetBytes: 5_000_000,
  },
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
    onImageSelected: jest.fn(),
    ...overrides,
  };

  return { ...render(<ImageUploadDialog {...props} />), props };
};

describe('ImageUploadDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCameraModule.CameraView = MockCameraView;
    mockedCameraModule.useCameraPermissions = () => [
      mockCameraPermission,
      mockRequestCameraPermission,
    ];
    mockCameraProps = null;
    mockCameraPermission = null;
    mockIsCameraAvailable.mockResolvedValue(true);
    mockRequestCameraPermission.mockResolvedValue(grantedPermission);
    mockTakePicture.mockResolvedValue({
      uri: 'file://camera.jpg',
      base64: 'camera-base64',
      width: 1200,
      height: 1200,
      format: 'jpg',
    });
    mockCompressImage.mockResolvedValue(compressedImage);
    getImagePickerMocks().requestMediaLibraryPermissionsAsync.mockResolvedValue(
      grantedPermission,
    );
    getImagePickerMocks().launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    });
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
            base64: 'gallery-base64',
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
        expect.objectContaining({ allowsEditing, base64: true }),
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

  it('requests camera permission lazily and opens a mirrored front camera for avatars', async () => {
    const screen = renderDialog();

    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Take a photo'));

    await screen.findByTestId('camera-preview');
    expect(mockIsCameraAvailable).toHaveBeenCalledTimes(1);
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
    expect(mockCameraProps).toEqual(
      expect.objectContaining({ facing: 'front', mirror: true, mode: 'picture', mute: true }),
    );
    expect(screen.getByLabelText('Capture photo').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    expect(screen.getByLabelText('Capture photo').props.accessibilityState.disabled).toBe(false);
  });

  it('uses the rear camera for banners, flips cameras, captures, and unmounts for preview', async () => {
    const screen = renderDialog({}, 'banner');
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');

    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'back', mirror: false }));
    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Flip camera'));
    expect(mockCameraProps).toEqual(expect.objectContaining({ facing: 'front', mirror: false }));

    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Capture photo'));

    await screen.findByLabelText('Selected image preview');
    expect(screen.queryByTestId('camera-preview')).toBeNull();
    expect(screen.getByLabelText('Retake')).toBeTruthy();
    expect(mockTakePicture).toHaveBeenCalledTimes(1);
  });

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

  it('compresses and completes exactly once when Use photo is pressed repeatedly', async () => {
    let resolveCompression: (value: typeof compressedImage) => void = () => undefined;
    mockCompressImage.mockReturnValue(
      new Promise<typeof compressedImage>((resolve) => {
        resolveCompression = resolve;
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
          base64: 'gallery-base64',
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
    fireEvent.press(screen.getByLabelText('Optimising…'));
    resolveCompression(compressedImage);

    await waitFor(() => expect(screen.props.onImageSelected).toHaveBeenCalledTimes(1));
    expect(mockCompressImage).toHaveBeenCalledTimes(1);
    expect(mockCompressImage).toHaveBeenCalledWith('data:image/jpeg;base64,gallery-base64');
    expect(screen.props.onImageSelected).toHaveBeenCalledWith(compressedImage);
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
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
    mockCompressImage.mockRejectedValueOnce(new Error('compress failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog();
    fireEvent.press(screen.getByLabelText('Choose from gallery'));
    await screen.findByLabelText('Selected image preview');

    fireEvent.press(screen.getByLabelText('Use photo'));

    expect(
      await screen.findByText(
        'We couldn’t optimise this image. Please try again or choose a different photo.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Use photo')).toBeTruthy();
    expect(screen.props.onImageSelected).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('preserves camera dimensions and offers gallery after camera processing fails', async () => {
    mockTakePicture.mockResolvedValue({
      uri: 'file://camera-wide.jpg',
      base64: 'camera-wide-base64',
      width: 1600,
      height: 900,
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
          base64: 'gallery-fallback-base64',
          assetId: null,
          duration: null,
          exif: null,
          pairedVideoAsset: null,
        },
      ],
    });
    mockCompressImage.mockRejectedValueOnce(new Error('compress failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const screen = renderDialog({}, 'attachment');
    fireEvent.press(screen.getByLabelText('Take a photo'));
    await screen.findByTestId('camera-preview');
    fireEvent.press(screen.getByLabelText('Mark camera ready'));
    fireEvent.press(screen.getByLabelText('Capture photo'));
    await screen.findByLabelText('Selected image preview');

    expect(
      StyleSheet.flatten(screen.getByTestId('selected-image-frame').props.style).aspectRatio,
    ).toBe(1600 / 900);
    fireEvent.press(screen.getByLabelText('Use photo'));

    await screen.findByText(
      'We couldn’t optimise this image. Please try again or choose a different photo.',
    );
    expect(screen.getByLabelText('Retake')).toBeTruthy();
    expect(screen.getByLabelText('Use photo')).toBeTruthy();
    expect(screen.getByLabelText('Choose from gallery')).toBeTruthy();
    expect(screen.getByLabelText('Cancel')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Choose from gallery'));

    await screen.findByLabelText('Choose another');
    expect(getImagePickerMocks().launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(
      StyleSheet.flatten(screen.getByTestId('selected-image-frame').props.style).aspectRatio,
    ).toBe(900 / 1200);
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
    expect(screen.props.onImageSelected).not.toHaveBeenCalled();
    expect(screen.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores a late gallery result after the dialog is hidden', async () => {
    let resolvePicker: (value: ImagePicker.ImagePickerResult) => void = () => undefined;
    getImagePickerMocks().launchImageLibraryAsync.mockReturnValue(
      new Promise<ImagePicker.ImagePickerResult>((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const onImageSelected = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <ImageUploadDialog
        visible
        imageKind="attachment"
        onImageSelected={onImageSelected}
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
        onImageSelected={onImageSelected}
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

    await waitFor(() => expect(onImageSelected).not.toHaveBeenCalled());
    expect(screen.queryByLabelText('Selected image preview')).toBeNull();
  });
});
