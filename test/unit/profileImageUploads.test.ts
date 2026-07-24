import { deleteStoredImage } from '../../src/services/storageService';
import { uploadProfileImagesWithCleanup } from '../../src/utils/profileImageUploads';
import type { StoredImage } from '../../src/types/stored-image';

jest.mock('../../src/services/storageService', () => ({
  deleteStoredImage: jest.fn(),
}));

const mockDeleteStoredImage = deleteStoredImage as jest.MockedFunction<typeof deleteStoredImage>;

const makeImage = (kind: 'avatar' | 'banner'): StoredImage => ({
  uploadId: `upload-${kind}`,
  publicUrl: `https://cdn.example.com/profile-images/user-1/${kind}.jpg`,
  bucket: 'profile-images',
  objectPath: `user-1/${kind}.jpg`,
  width: 100,
  height: 100,
  size: 123,
  mimeType: 'image/jpeg',
});

describe('uploadProfileImagesWithCleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteStoredImage.mockResolvedValue({ success: true, error: null });
  });

  it('uses the already-uploaded public URLs without a second upload', async () => {
    const avatarImage = makeImage('avatar');
    const bannerImage = makeImage('banner');
    const result = await uploadProfileImagesWithCleanup({ avatarImage, bannerImage });

    expect(result.avatarUrl).toBe(avatarImage.publicUrl);
    expect(result.bannerUrl).toBe(bannerImage.publicUrl);
    expect(mockDeleteStoredImage).not.toHaveBeenCalled();
  });

  it('exposes Storage API cleanup for uncommitted images', async () => {
    const avatarImage = makeImage('avatar');
    const bannerImage = makeImage('banner');
    const result = await uploadProfileImagesWithCleanup({
      avatarImage,
      bannerImage,
    });
    await result.cleanupUploadedImages();

    expect(mockDeleteStoredImage).toHaveBeenNthCalledWith(1, avatarImage);
    expect(mockDeleteStoredImage).toHaveBeenNthCalledWith(2, bannerImage);
  });
});
