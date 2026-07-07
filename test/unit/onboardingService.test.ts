import { supabase } from '../../src/lib/supabase';
import {
  resolveOnboardingState,
  saveOptionalProfileDetails,
  saveProfileBasicsDraft,
  saveRequiredProfileBasics,
  skipOptionalProfileDetails,
} from '../../src/services/onboardingService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

type MockSupabaseResult = { data: unknown; error: unknown };

const makeBuilder = (maybeSingleResult: MockSupabaseResult = { data: null, error: null }) => {
  const builder: Record<string, jest.Mock> = {};
  Object.assign(builder, {
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => maybeSingleResult),
    select: jest.fn(() => builder),
    then: jest.fn((resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
    ),
    update: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
  });
  return builder;
};

const onboardedProfile = {
  id: 'user-1',
  email: 'alex@example.com',
  display_name: 'Alex Johnson',
  user_name: 'alex',
  date_of_birth: '1998-04-12',
  gender: 'other',
  optional_profile_completed_at: '2026-07-05T12:00:00.000Z',
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

  it('marks optional profile complete when skipped', async () => {
    mockSupabase.auth.getUser
      .mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'alex@example.com' } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'alex@example.com' } },
        error: null,
      });

    const updateBuilder = makeBuilder();
    const profileBuilder = makeBuilder({ data: onboardedProfile, error: null });
    const draftBuilder = makeBuilder({ data: null, error: null });
    mockSupabase.from
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(profileBuilder)
      .mockReturnValueOnce(draftBuilder);

    const result = await skipOptionalProfileDetails('user-1');

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe('fully-onboarded');
    expect(updateBuilder.update).toHaveBeenCalledWith({
      optional_profile_completed_at: expect.any(String),
    });
    expect(mockSupabase.from.mock.calls.map(([table]) => table)).toEqual([
      'profiles',
      'profiles',
      'profile_basics_drafts',
    ]);
  });

  it('saves optional social details before marking optional profile complete', async () => {
    mockSupabase.auth.getUser
      .mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'alex@example.com' } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'alex@example.com' } },
        error: null,
      });

    const socialBuilder = makeBuilder();
    const updateBuilder = makeBuilder();
    const profileBuilder = makeBuilder({ data: onboardedProfile, error: null });
    const draftBuilder = makeBuilder({ data: null, error: null });
    mockSupabase.from
      .mockReturnValueOnce(socialBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(profileBuilder)
      .mockReturnValueOnce(draftBuilder);

    const result = await saveOptionalProfileDetails({
      bio: 'Hello Radar',
      instagram: 'alex',
    }, 'user-1');

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe('fully-onboarded');
    expect(socialBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        bio: 'Hello Radar',
        instagram: 'alex',
      }),
      { onConflict: 'id' },
    );
    expect(updateBuilder.update).toHaveBeenCalledWith({
      optional_profile_completed_at: expect.any(String),
    });
  });
});
