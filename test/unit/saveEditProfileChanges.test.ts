import { getCurrentUser } from '../../src/services/authService';
import { updateProfileDisplayName, updateSocialLinks } from '../../src/services/profileService';
import { saveEditProfileChanges } from '../../src/hooks/saveEditProfileChanges';
import { uploadProfileImagesWithCleanup } from '../../src/utils/profileImageUploads';
import type {
  EditProfileDraft,
  EditProfilePendingImages,
} from '../../src/hooks/useEditProfile';
import type { CompressedImage } from '../../src/utils/imageCompression';

jest.mock('../../src/services/authService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../../src/services/profileService', () => ({
  updateProfileDisplayName: jest.fn(),
  updateSocialLinks: jest.fn(),
}));

jest.mock('../../src/services/storageService', () => ({
  deleteImageFromStorage: jest.fn(async () => ({ success: true, error: null })),
}));

jest.mock('../../src/utils/profileImageUploads', () => ({
  uploadProfileImagesWithCleanup: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockUpdateProfileDisplayName = updateProfileDisplayName as jest.MockedFunction<typeof updateProfileDisplayName>;
const mockUpdateSocialLinks = updateSocialLinks as jest.MockedFunction<typeof updateSocialLinks>;
const mockUploadProfileImagesWithCleanup = uploadProfileImagesWithCleanup as jest.MockedFunction<
  typeof uploadProfileImagesWithCleanup
>;

const makeImage = (): CompressedImage => ({
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
    targetBytes: 550 * 1024,
  },
});

const baseDraft: EditProfileDraft = {
  displayName: 'New Name',
  bio: '',
  bannerImage: null,
  profileImage: null,
  instagram: '',
  twitter: '',
  linkedin: '',
};

const basePending: EditProfilePendingImages = {
  avatarUpload: makeImage(),
  bannerRemoval: false,
  bannerUpload: null,
  oldBannerUrl: null,
  oldProfileUrl: null,
  profileRemoval: false,
};

describe('saveEditProfileChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as any);
    mockUpdateProfileDisplayName.mockResolvedValue({ success: true, error: null });
    mockUpdateSocialLinks.mockResolvedValue({ socialLinks: null, error: null });
    mockUploadProfileImagesWithCleanup.mockResolvedValue({
      avatarUrl: undefined,
      bannerUrl: undefined,
      cleanupUploadedImages: jest.fn(async () => undefined),
    });
  });

  it('does not upload images when display name save fails first', async () => {
    mockUpdateProfileDisplayName.mockResolvedValueOnce({
      success: false,
      error: new Error('display name failed'),
    });

    await expect(
      saveEditProfileChanges({
        draft: baseDraft,
        originalDisplayName: 'Old Name',
        pending: basePending,
        refresh: jest.fn(async () => undefined),
      }),
    ).rejects.toThrow('display name failed');

    expect(mockUploadProfileImagesWithCleanup).not.toHaveBeenCalled();
    expect(mockUpdateSocialLinks).not.toHaveBeenCalled();
  });

  it('cleans up newly uploaded images when social links save fails', async () => {
    const cleanupUploadedImages = jest.fn(async () => undefined);
    mockUploadProfileImagesWithCleanup.mockResolvedValueOnce({
      avatarUrl: 'https://cdn.example.com/profile-images/user-1/avatar.jpg',
      bannerUrl: undefined,
      cleanupUploadedImages,
    });
    mockUpdateSocialLinks.mockResolvedValueOnce({
      socialLinks: null,
      error: new Error('social save failed'),
    });

    await expect(
      saveEditProfileChanges({
        draft: { ...baseDraft, displayName: 'Same Name' },
        originalDisplayName: 'Same Name',
        pending: basePending,
        refresh: jest.fn(async () => undefined),
      }),
    ).rejects.toThrow('social save failed');

    expect(cleanupUploadedImages).toHaveBeenCalledTimes(1);
  });
});
