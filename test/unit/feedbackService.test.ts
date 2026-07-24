import { supabase } from '../../src/lib/supabase';
import { submitFeedback } from '../../src/services/feedbackService';
import type { StoredImage } from '../../src/types/stored-image';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
  storage: { from: jest.Mock };
};

const feedbackImage: StoredImage = {
  uploadId: 'feedback-upload-1',
  publicUrl:
    'https://example.supabase.co/storage/v1/object/public/feedback-images/user-1/feedback-1.jpg',
  bucket: 'feedback-images',
  objectPath: 'user-1/feedback-1.jpg',
  width: 1200,
  height: 800,
  size: 12345,
  mimeType: 'image/jpeg',
};

describe('submitFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  it('persists the already-uploaded public URL without uploading again', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    mockSupabase.from.mockReturnValueOnce({ insert });

    await expect(submitFeedback('  Helpful feedback  ', feedbackImage)).resolves.toEqual({
      error: null,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('feedback');
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      message: 'Helpful feedback',
      image_url: feedbackImage.publicUrl,
    });
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });
});
