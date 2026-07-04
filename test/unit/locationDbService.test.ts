import { supabase } from '../../src/lib/supabase';
import { deleteUserLocation, updateUserLocation } from '../../src/services/locationDbService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

describe('location database service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts user location with the id conflict target', async () => {
    const upsert = jest.fn(async () => ({ error: null }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({ upsert });

    const result = await updateUserLocation(12.9716, 77.5946);

    expect(result).toEqual({ success: true, error: null });
    expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        lat_full: 12.9716,
        long_full: 77.5946,
        lat_short: 12.97,
        long_short: 77.59,
      }),
      { onConflict: 'id' },
    );
  });

  it('upserts null coordinates with the id conflict target when deleting location', async () => {
    const upsert = jest.fn(async () => ({ error: null }));
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({ upsert });

    const result = await deleteUserLocation();

    expect(result).toEqual({ success: true, error: null });
    expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        lat_full: null,
        long_full: null,
        lat_short: null,
        long_short: null,
      }),
      { onConflict: 'id' },
    );
  });

  it('does not touch locations when there is no authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await updateUserLocation(12.9716, 77.5946);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Not authenticated');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
