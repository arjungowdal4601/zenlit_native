import { supabase } from '../../src/lib/supabase';
import { uploadProfileImage } from '../../src/services/storageService';
import { MAX_IMAGE_SIZE_BYTES, type CompressedImage } from '../../src/utils/imageCompression';

jest.mock('../../src/utils/imageCompression', () => ({
  MAX_IMAGE_SIZE_BYTES: 550 * 1024,
  base64ToUint8Array: jest.fn((value: string) => new Uint8Array([value.length, 2, 3])),
  compressImage: jest.fn(async (uri: string) => ({
    uri,
    width: 100,
    height: 100,
    base64: 'compressed',
    size: 120,
    mimeType: 'image/jpeg',
    metadata: {
      originalSize: 900000,
      compressedSize: 120,
      compressionRatio: 0.1,
      iterations: 1,
      quality: 0.84,
      resized: false,
      targetBytes: 550 * 1024,
    },
  })),
}));

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  storage: { from: jest.Mock };
};

const makeImage = (overrides: Partial<CompressedImage> = {}): CompressedImage => ({
  uri: 'file://avatar.jpg',
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
    targetBytes: MAX_IMAGE_SIZE_BYTES,
  },
  ...overrides,
});

describe('uploadProfileImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads profile images under the authenticated user path with content type', async () => {
    const upload = jest.fn(async () => ({ data: null, error: null }));
    const getPublicUrl = jest.fn(() => ({
      data: { publicUrl: 'https://cdn.example.com/profile-images/user-123/avatar-1.jpg' },
      error: null,
    }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({ upload, getPublicUrl });

    const result = await uploadProfileImage(makeImage(), 'avatar', { timestamp: 1 });

    expect(result).toEqual({
      url: 'https://cdn.example.com/profile-images/user-123/avatar-1.jpg',
      error: null,
    });
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('profile-images');
    expect(upload).toHaveBeenCalledWith(
      'user-123/avatar-1.jpg',
      expect.any(ArrayBuffer),
      { contentType: 'image/jpeg', upsert: true },
    );
  });

  it('compresses images again before upload when they exceed the profile image size limit', async () => {
    const { compressImage } = jest.requireMock('../../src/utils/imageCompression') as {
      compressImage: jest.Mock;
    };
    const upload = jest.fn(async () => ({ data: null, error: null }));
    const getPublicUrl = jest.fn(() => ({
      data: { publicUrl: 'https://cdn.example.com/profile-images/user-123/banner-2.jpg' },
      error: null,
    }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({ upload, getPublicUrl });

    await uploadProfileImage(
      makeImage({
        size: MAX_IMAGE_SIZE_BYTES + 1,
        metadata: {
          originalSize: 900000,
          compressedSize: MAX_IMAGE_SIZE_BYTES + 1,
          compressionRatio: 1,
          iterations: 0,
          quality: 0.92,
          resized: false,
          targetBytes: MAX_IMAGE_SIZE_BYTES,
        },
      }),
      'banner',
      { timestamp: 2 },
    );

    expect(compressImage).toHaveBeenCalledWith('file://avatar.jpg');
    expect(upload).toHaveBeenCalledWith(
      'user-123/banner-2.jpg',
      expect.any(ArrayBuffer),
      { contentType: 'image/jpeg', upsert: true },
    );
  });

  it('returns a not authenticated error without attempting storage upload', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Auth session missing'),
    });

    const result = await uploadProfileImage(makeImage(), 'avatar');

    expect(result.url).toBeNull();
    expect(result.error?.message).toBe('Not authenticated');
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });
});
