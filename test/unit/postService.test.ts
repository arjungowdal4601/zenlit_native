import { supabase } from '../../src/lib/supabase';
import { createPost, deletePost } from '../../src/services/postService';
import { deleteImageFromStorage } from '../../src/services/storageService';

jest.mock('../../src/services/storageService', () => ({
  deleteImageFromStorage: jest.fn(),
}));

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

const mockDeleteImage = deleteImageFromStorage as jest.MockedFunction<
  typeof deleteImageFromStorage
>;

const makeDeleteQuery = (result: { data: unknown; error: Error | null }) => {
  const query: Record<string, jest.Mock> = {};
  query.delete = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.maybeSingle = jest.fn(async () => result);
  return query;
};

const makeInsertQuery = (result: { data: unknown; error: Error | null }) => {
  const query: Record<string, jest.Mock> = {};
  query.insert = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.single = jest.fn(async () => result);
  return query;
};

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the already-uploaded public URL without another Storage upload', async () => {
    const imageUrl =
      'https://example.supabase.co/storage/v1/object/public/post-images/user-1/post-1.jpg';
    const createdPost = {
      id: 'post-1',
      user_id: 'user-1',
      content: 'Hello Zenlit',
      image_url: imageUrl,
    };
    const query = makeInsertQuery({ data: createdPost, error: null });
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(query);

    await expect(createPost('  Hello Zenlit  ', imageUrl)).resolves.toEqual({
      post: createdPost,
      error: null,
    });

    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      content: 'Hello Zenlit',
      image_url: imageUrl,
    });
    expect(deleteImageFromStorage).not.toHaveBeenCalled();
  });
});

describe('deletePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteImage.mockResolvedValue({ success: true, error: null });
  });

  it('deletes the database row before removing its stored image', async () => {
    const order: string[] = [];
    const query = makeDeleteQuery({
      data: {
        image_url:
          'https://example.supabase.co/storage/v1/object/public/post-images/user-1/post-1.jpg',
      },
      error: null,
    });
    query.maybeSingle.mockImplementationOnce(async () => {
      order.push('database');
      return {
        data: {
          image_url:
            'https://example.supabase.co/storage/v1/object/public/post-images/user-1/post-1.jpg',
        },
        error: null,
      };
    });
    mockDeleteImage.mockImplementationOnce(async () => {
      order.push('storage');
      return { success: true, error: null };
    });
    mockSupabase.from.mockReturnValueOnce(query);

    await expect(deletePost('post-1')).resolves.toEqual({ success: true, error: null });

    expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    expect(query.delete).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith('id', 'post-1');
    expect(query.select).toHaveBeenCalledWith('image_url');
    expect(mockDeleteImage).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/public/post-images/user-1/post-1.jpg',
      'post-images',
    );
    expect(order).toEqual(['database', 'storage']);
  });

  it('does not touch Storage when the database delete fails', async () => {
    const error = new Error('delete failed');
    const query = makeDeleteQuery({ data: null, error });
    mockSupabase.from.mockReturnValueOnce(query);

    await expect(deletePost('post-2')).resolves.toEqual({ success: false, error });
    expect(mockDeleteImage).not.toHaveBeenCalled();
  });

  it('keeps a successful post deletion when queued Storage cleanup fails', async () => {
    const cleanupError = new Error('offline');
    const query = makeDeleteQuery({
      data: {
        image_url:
          'https://example.supabase.co/storage/v1/object/public/post-images/user-1/post-3.jpg',
      },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(query);
    mockDeleteImage.mockResolvedValueOnce({ success: false, error: cleanupError });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(deletePost('post-3')).resolves.toEqual({ success: true, error: null });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Post deleted, but its stored image cleanup will be retried:',
      cleanupError,
    );
    consoleSpy.mockRestore();
  });
});
