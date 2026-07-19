import { supabase } from '../../src/lib/supabase';
import { deleteUserLocation, isUserNearby, updateUserLocation } from '../../src/services/locationDbService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
  rpc: jest.Mock;
};

describe('location database service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes user location through the auth-bound RPC', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await updateUserLocation(12.9716, 77.5946);

    expect(result).toEqual({ success: true, error: null });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('set_my_location', {
      latitude: 12.9716,
      longitude: 77.5946,
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('clears user location through the same auth-bound RPC', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await deleteUserLocation();

    expect(result).toEqual({ success: true, error: null });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('set_my_location', {
      latitude: null,
      longitude: null,
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
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
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('checks proximity through the auth-scoped RPC without reading coordinates', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

    const result = await isUserNearby('user-456');

    expect(result).toEqual({ isNearby: true, error: null });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('is_user_nearby', {
      target_user_id: 'user-456',
    });
  });
});
