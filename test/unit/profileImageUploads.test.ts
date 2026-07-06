import { deleteImageFromStorage, uploadProfileImage } from '../../src/services/storageService';
import { uploadProfileImagesWithCleanup } from '../../src/utils/profileImageUploads';
import type { CompressedImage } from '../../src/utils/imageCompression';

jest.mock('../../src/services/storageService', () => ({
  deleteImageFromStorage: jest.fn(),
  uploadProfileImage: jest.fn(),
}));

const mockDeleteImageFromStorage = deleteImageFromStorage as jest.MockedFunction<typeof deleteImageFromStorage>;
const mockUploadProfileImage = uploadProfileImage as jest.MockedFunction<typeof uploadProfileImage>;

const makeImage = (uri: string): CompressedImage => ({
  uri,
  width: 100,
  height: 100,
  base64: 'abc123',
  size: 123,
  mimeType: 'image/jpeg',
  metadata: {
    originalSize: 123,
    compressedSize: 123,
    compressionRatio: 1,
    iterations: 0,
    quality: 0.92,
    resized: false,
    targetBytes: 550 * 1024,
  },
});

describe('uploadProfileImagesWithCleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteImageFromStorage.mockResolvedValue({ success: true, error: null });
  });

  it('cleans up an uploaded avatar when the banner upload fails', async () => {
    mockUploadProfileImage
      .mockResolvedValueOnce({
        url: 'https://cdn.example.com/profile-images/user-1/avatar.jpg',
        error: null,
      })
      .mockResolvedValueOnce({
        url: null,
        error: new Error('banner upload failed'),
      });

    await expect(
      uploadProfileImagesWithCleanup({
        avatarImage: makeImage('file://avatar.jpg'),
        bannerImage: makeImage('file://banner.jpg'),
      }),
    ).rejects.toThrow('Failed to upload the new banner image. Please try again.');

    expect(mockDeleteImageFromStorage).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/user-1/avatar.jpg',
      'profile-images',
    );
  });

  it('exposes cleanup for callers when a later database save fails', async () => {
    mockUploadProfileImage
      .mockResolvedValueOnce({
        url: 'https://cdn.example.com/profile-images/user-1/avatar.jpg',
        error: null,
      })
      .mockResolvedValueOnce({
        url: 'https://cdn.example.com/profile-images/user-1/banner.jpg',
        error: null,
      });

    const result = await uploadProfileImagesWithCleanup({
      avatarImage: makeImage('file://avatar.jpg'),
      bannerImage: makeImage('file://banner.jpg'),
    });
    await result.cleanupUploadedImages();

    expect(mockDeleteImageFromStorage).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/user-1/avatar.jpg',
      'profile-images',
    );
    expect(mockDeleteImageFromStorage).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/user-1/banner.jpg',
      'profile-images',
    );
  });
});
