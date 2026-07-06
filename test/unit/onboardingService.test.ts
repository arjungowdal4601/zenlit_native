import { supabase } from '../../src/lib/supabase';
import {
  resolveOnboardingState,
  saveProfileBasicsDraft,
  saveRequiredProfileBasics,
} from '../../src/services/onboardingService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

describe('onboarding service auth guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not trust a supplied user id when Supabase has no authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Auth session missing'),
    });

    const result = await saveProfileBasicsDraft(
      {
        display_name: 'Alex Johnson',
        user_name: 'alex',
        date_of_birth: '1998-04-12',
        gender: 'other',
      },
      'user-from-route',
    );

    expect(result.data).toBeNull();
    expect(result.error?.message).toContain('Not authenticated');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('rejects writes when the supplied user id does not match the authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'real-user', email: 'alex@example.com' } },
      error: null,
    });

    const result = await saveProfileBasicsDraft(
      {
        display_name: 'Alex Johnson',
        user_name: 'alex',
        date_of_birth: '1998-04-12',
        gender: 'other',
      },
      'other-user',
    );

    expect(result.data).toBeNull();
    expect(result.error?.message).toContain('Authenticated user mismatch');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('treats a cached user id as guest when Supabase says the auth user no longer exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('User from sub claim in JWT does not exist'),
    });

    const state = await resolveOnboardingState({ userId: 'deleted-user' });

    expect(state.status).toBe('guest');
    expect(state.userId).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('sends a successful basics save straight to optional profile', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'alex@example.com' } },
      error: null,
    });

    const result = await saveRequiredProfileBasics(
      {
        display_name: 'Alex Johnson',
        user_name: 'alex',
        date_of_birth: '1998-04-12',
        gender: 'other',
      },
      'user-1',
    );

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe('optional-profile-details');
    expect(mockSupabase.from.mock.calls.map(([table]) => table)).toEqual([
      'profiles',
      'profile_basics_drafts',
    ]);
  });
});
