import { supabase } from '../../src/lib/supabase';
import {
  getCurrentUser,
  onAuthChange,
  signInWithEmailOtp,
  signOut,
  verifyEmailOtp,
} from '../../src/services/authService';

const mockSupabase = supabase as unknown as {
  auth: {
    getUser: jest.Mock;
    signInWithOtp: jest.Mock;
    verifyOtp: jest.Mock;
    signOut: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the current auth user to the app user shape', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'alex@example.com' } },
      error: null,
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'alex@example.com',
    });
  });

  it('wraps email OTP sign in and verification', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
      data: { user: { id: 'user-3', email: 'otp@example.com' } },
      error: null,
    });

    await signInWithEmailOtp('otp@example.com');
    const verified = await verifyEmailOtp('otp@example.com', '123456');

    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'otp@example.com',
      options: { shouldCreateUser: true },
    });
    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'otp@example.com',
      token: '123456',
      type: 'email',
    });
    expect(verified).toEqual({
      user: { id: 'user-3', email: 'otp@example.com' },
      error: null,
    });
  });

  it('wraps sign out scope and auth change unsubscribe', async () => {
    const unsubscribe = jest.fn();
    const seen: Array<{ event: string; userId: string | null }> = [];
    mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      void callback('SIGNED_IN', { user: { id: 'user-4', email: 'event@example.com' } });
      return { data: { subscription: { unsubscribe } } };
    });

    const stop = onAuthChange((event, user) => {
      seen.push({ event, userId: user?.id ?? null });
    });
    await Promise.resolve();
    stop();
    await signOut('local');

    expect(seen).toEqual([{ event: 'SIGNED_IN', userId: 'user-4' }]);
    expect(unsubscribe).toHaveBeenCalled();
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
