import { supabase } from '../../src/lib/supabase';
import {
  getNotificationSettings,
  normalizeNotificationPreferences,
  removePushToken,
  savePushToken,
  updateNotificationSettings,
} from '../../src/services/notificationService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
  rpc: jest.Mock;
};

const makeBuilder = (result: { data?: unknown; error?: Error | null } = {}) => {
  const builder: Record<string, jest.Mock> = {};
  Object.assign(builder, {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    single: jest.fn(async () => ({ data: result.data ?? null, error: result.error ?? null })),
    then: jest.fn((resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(resolve),
    ),
  });
  return builder;
};

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes missing and partial notification preferences', () => {
    expect(normalizeNotificationPreferences(null)).toEqual({
      messages: true,
      muted_conversations: [],
    });
    expect(normalizeNotificationPreferences({ messages: false })).toEqual({
      messages: false,
      muted_conversations: [],
    });
  });

  it('loads notification settings for the authenticated user', async () => {
    const builder = makeBuilder({
      data: {
        notification_enabled: false,
        notification_preferences: { messages: false, muted_conversations: ['thread-1'] },
      },
    });
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabase.rpc.mockReturnValueOnce(builder);

    const result = await getNotificationSettings();

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_my_private_profile');
    expect(result).toEqual({
      settings: {
        enabled: false,
        preferences: { messages: false, muted_conversations: ['thread-1'] },
      },
      error: null,
    });
  });

  it('saves and removes push tokens on the profile row', async () => {
    const saveBuilder = makeBuilder();
    const removeBuilder = makeBuilder();
    mockSupabase.auth.getUser
      .mockResolvedValueOnce({ data: { user: { id: 'user-2' } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: 'user-2' } }, error: null });
    mockSupabase.from.mockReturnValueOnce(saveBuilder).mockReturnValueOnce(removeBuilder);

    await savePushToken('ExponentPushToken[test]');
    await removePushToken();

    expect(saveBuilder.update).toHaveBeenCalledWith({
      expo_push_token: 'ExponentPushToken[test]',
      last_token_update: expect.any(String),
    });
    expect(removeBuilder.update).toHaveBeenCalledWith({
      expo_push_token: null,
      last_token_update: expect.any(String),
    });
    expect(saveBuilder.eq).toHaveBeenCalledWith('id', 'user-2');
    expect(removeBuilder.eq).toHaveBeenCalledWith('id', 'user-2');
  });

  it('merges preference updates with existing settings', async () => {
    const readBuilder = makeBuilder({
      data: {
        notification_enabled: false,
        notification_preferences: { messages: false, muted_conversations: ['thread-2'] },
      },
    });
    const updateBuilder = makeBuilder();
    mockSupabase.auth.getUser
      .mockResolvedValueOnce({ data: { user: { id: 'user-3' } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: 'user-3' } }, error: null });
    mockSupabase.rpc.mockReturnValueOnce(readBuilder);
    mockSupabase.from.mockReturnValueOnce(updateBuilder);

    const result = await updateNotificationSettings({
      enabled: true,
      preferences: { messages: true },
    });

    expect(updateBuilder.update).toHaveBeenCalledWith({
      notification_enabled: true,
      notification_preferences: {
        messages: true,
        muted_conversations: ['thread-2'],
      },
    });
    expect(result).toEqual({
      settings: {
        enabled: true,
        preferences: {
          messages: true,
          muted_conversations: ['thread-2'],
        },
      },
      error: null,
    });
  });
});
