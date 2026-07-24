import { getCurrentUser } from '../../src/services/authService';
import { updateProfileDisplayName, updateSocialLinks } from '../../src/services/profileService';
import { saveEditProfileChanges } from '../../src/hooks/saveEditProfileChanges';
import { deleteImageFromStorage } from '../../src/services/storageService';
import type {
  EditProfileDraft,
  EditProfilePendingImages,
} from '../../src/hooks/useEditProfile';
import type { StoredImage } from '../../src/types/stored-image';

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

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockUpdateProfileDisplayName = updateProfileDisplayName as jest.MockedFunction<typeof updateProfileDisplayName>;
const mockUpdateSocialLinks = updateSocialLinks as jest.MockedFunction<typeof updateSocialLinks>;
const mockDeleteImageFromStorage = deleteImageFromStorage as jest.MockedFunction<typeof deleteImageFromStorage>;

const makeImage = (): StoredImage => ({
  uploadId: 'upload-avatar',
  publicUrl: 'https://cdn.example.com/profile-images/user-1/avatar.jpg',
  bucket: 'profile-images',
  objectPath: 'user-1/avatar.jpg',
  width: 100,
  height: 100,
  size: 123,
  mimeType: 'image/jpeg',
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
  });

  it('does not write social links when display name save fails first', async () => {
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

    expect(mockUpdateSocialLinks).not.toHaveBeenCalled();
  });

  it('retains an immediate upload when the social links save fails', async () => {
    const commitPendingImages = jest.fn();
    mockUpdateSocialLinks.mockResolvedValueOnce({
      socialLinks: null,
      error: new Error('social save failed'),
    });

    await expect(
      saveEditProfileChanges({
        draft: { ...baseDraft, displayName: 'Same Name' },
        originalDisplayName: 'Same Name',
        pending: basePending,
        commitPendingImages,
        refresh: jest.fn(async () => undefined),
      }),
    ).rejects.toThrow('social save failed');

    expect(mockUpdateSocialLinks).toHaveBeenCalledWith(expect.objectContaining({
      profile_pic_url: basePending.avatarUpload?.publicUrl,
    }));
    expect(commitPendingImages).not.toHaveBeenCalled();
    expect(mockDeleteImageFromStorage).not.toHaveBeenCalled();
  });

  it('commits the pending URL immediately after the database accepts it', async () => {
    const order: string[] = [];
    const commitPendingImages = jest.fn(() => order.push('commit'));
    mockUpdateSocialLinks.mockImplementationOnce(async () => {
      order.push('database');
      return {
        socialLinks: { profile_pic_url: basePending.avatarUpload?.publicUrl } as any,
        error: null,
      };
    });

    await saveEditProfileChanges({
      draft: { ...baseDraft, displayName: 'Same Name' },
      originalDisplayName: 'Same Name',
      pending: basePending,
      commitPendingImages,
      refresh: jest.fn(async () => {
        order.push('refresh');
      }),
    });

    expect(order).toEqual(['database', 'commit', 'refresh']);
  });
});
