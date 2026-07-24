import { supabase } from '../../src/lib/supabase';
import {
  deleteImageFromStorage,
  deleteStoredImage,
  uploadImageFromUri,
} from '../../src/services/storageService';
import { getPendingUploadRecords } from '../../src/services/pendingUploadLedger';
import {
  compressImage,
  prepareCameraCapture,
} from '../../src/utils/imageCompression';
import {
  VALID_2X2_JPEG_BYTES,
  VALID_2X2_JPEG_DATA_URI,
} from '../fixtures/imageFixtures';
import { installMemoryStorage } from '../utils/memoryStorage';

jest.mock('../../src/utils/imageCompression', () => ({
  MAX_IMAGE_SIZE_BYTES: 550 * 1024,
  compressImage: jest.fn(),
  prepareCameraCapture: jest.fn(),
}));

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  storage: { from: jest.Mock };
};

const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>;
const mockPrepareCameraCapture = prepareCameraCapture as jest.MockedFunction<
  typeof prepareCameraCapture
>;

installMemoryStorage();

type PreparedImage = Awaited<ReturnType<typeof compressImage>>;

const makePreparedImage = (
  overrides: Partial<PreparedImage> = {},
): PreparedImage => {
  const blob = new Blob(['jpeg-binary'], { type: 'image/jpeg' });
  return {
    blob,
    width: 640,
    height: 480,
    size: blob.size,
    mimeType: 'image/jpeg',
    metadata: {
      originalSize: 100,
      compressedSize: blob.size,
      compressionRatio: blob.size / 100,
      iterations: 1,
      quality: 0.84,
      resized: false,
      targetBytes: 550 * 1024,
    },
    cleanup: jest.fn(),
    ...overrides,
  } as PreparedImage;
};

describe('Storage image lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uploads a binary JPEG Blob under a unique UID path and retains the returned path', async () => {
    const cameraBlob = new Blob(
      [VALID_2X2_JPEG_BYTES.buffer as ArrayBuffer],
      { type: 'image/jpeg' },
    );
    const prepared = makePreparedImage({
      blob: cameraBlob,
      width: 2,
      height: 2,
      size: cameraBlob.size,
    });
    mockPrepareCameraCapture.mockResolvedValueOnce(prepared);
    const upload = jest.fn(async (_path: string, _body: Blob, _options: object) => ({
      data: { path: 'user-123/avatar-100-upload-abc.jpg' },
      error: null,
    }));
    const getPublicUrl = jest.fn(() => ({
      data: {
        publicUrl:
          'https://project.supabase.co/storage/v1/object/public/profile-images/user-123/avatar-100-upload-abc.jpg',
      },
    }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({
      upload,
      getPublicUrl,
      remove: jest.fn(),
    });
    const onProgress = jest.fn();

    const result = await uploadImageFromUri(
      VALID_2X2_JPEG_DATA_URI,
      { bucket: 'profile-images', prefix: 'avatar' },
      {
        source: 'camera',
        width: 2,
        height: 2,
        timestamp: 100,
        uploadId: 'upload-abc',
        onProgress,
      },
    );

    expect(mockPrepareCameraCapture).toHaveBeenCalledWith(
      VALID_2X2_JPEG_DATA_URI,
      expect.objectContaining({ width: 2, height: 2 }),
    );
    expect(mockCompressImage).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith(
      'user-123/avatar-100-upload-abc.jpg',
      cameraBlob,
      { contentType: 'image/jpeg', upsert: false },
    );
    expect(upload.mock.calls[0][1]).toBeInstanceOf(Blob);
    expect(typeof upload.mock.calls[0][1]).not.toBe('string');
    expect(Array.from(VALID_2X2_JPEG_BYTES.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);
    expect(getPublicUrl).toHaveBeenCalledWith('user-123/avatar-100-upload-abc.jpg');
    expect(result).toEqual({
      image: {
        uploadId: 'upload-abc',
        publicUrl:
          'https://project.supabase.co/storage/v1/object/public/profile-images/user-123/avatar-100-upload-abc.jpg',
        bucket: 'profile-images',
        objectPath: 'user-123/avatar-100-upload-abc.jpg',
        width: 2,
        height: 2,
        size: cameraBlob.size,
        mimeType: 'image/jpeg',
      },
      error: null,
    });
    expect(onProgress.mock.calls.map(([phase]) => phase)).toEqual(['preparing', 'uploading']);
    expect(prepared.cleanup).toHaveBeenCalledTimes(1);
    expect(getPendingUploadRecords('user-123')).toHaveLength(1);
    const ledgerMetadata = Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index);
      return key ? localStorage.getItem(key) : null;
    }).join('');
    expect(ledgerMetadata).not.toContain('base64');
  });

  it.each([
    ['profile-images', 'avatar'],
    ['profile-images', 'banner'],
    ['post-images', 'post'],
    ['feedback-images', 'feedback'],
  ] as const)('uses the selected %s target', async (bucketName, prefix) => {
    mockCompressImage.mockResolvedValueOnce(makePreparedImage());
    const upload = jest.fn(async (path: string) => ({ data: { path }, error: null }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({
      upload,
      getPublicUrl: jest.fn((path: string) => ({ data: { publicUrl: `https://cdn/${path}` } })),
      remove: jest.fn(),
    });

    const result = await uploadImageFromUri('file://image.jpg', {
      bucket: bucketName,
      prefix,
    }, { source: 'gallery', timestamp: 200, uploadId: 'target-id' });

    expect(mockSupabase.storage.from).toHaveBeenCalledWith(bucketName);
    expect(mockCompressImage).toHaveBeenCalledWith('file://image.jpg');
    expect(mockPrepareCameraCapture).not.toHaveBeenCalled();
    expect(result.image?.objectPath).toBe(`user-123/${prefix}-200-target-id.jpg`);
  });

  it('does not upload when there is no authenticated user', async () => {
    const compressed = makePreparedImage();
    mockCompressImage.mockResolvedValueOnce(compressed);
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Session missing'),
    });

    const result = await uploadImageFromUri('file://avatar.jpg', {
      bucket: 'profile-images',
      prefix: 'avatar',
    }, { source: 'gallery' });

    expect(result.image).toBeNull();
    expect(result.error?.message).toBe('Not authenticated');
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    expect(compressed.cleanup).toHaveBeenCalledTimes(1);
  });

  it('deletes by the retained bucket and object path', async () => {
    const remove = jest.fn(async () => ({ data: null, error: null }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({ remove });

    const result = await deleteStoredImage({
      bucket: 'post-images',
      objectPath: 'user-123/post-100-id.jpg',
    });

    expect(remove).toHaveBeenCalledWith(['user-123/post-100-id.jpg']);
    expect(result).toEqual({ success: true, error: null });
    expect(getPendingUploadRecords('user-123')).toEqual([]);
  });

  it('keeps legacy public URL deletion scoped to the exact bucket path', async () => {
    const remove = jest.fn(async () => ({ data: null, error: null }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.storage.from.mockReturnValueOnce({ remove });

    await deleteImageFromStorage(
      'https://project.supabase.co/storage/v1/object/public/profile-images/user-123/avatar-old.jpg?download=1',
      'profile-images',
    );

    expect(remove).toHaveBeenCalledWith(['user-123/avatar-old.jpg']);
  });

  it('rejects a URL that is not a public URL for the expected bucket', async () => {
    const result = await deleteImageFromStorage(
      'https://example.com/unrelated/user-123/avatar.jpg',
      'profile-images',
    );

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('identify');
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});
