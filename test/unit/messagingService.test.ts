import { supabase } from '../../src/lib/supabase';
import { sendMessage } from '../../src/services/messagingService';

const mockSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
  functions?: { invoke: jest.Mock };
};

const persistedMessage = {
  id: '00000000-0000-4000-8000-000000000021',
  sender_id: 'user-1',
  receiver_id: 'user-2',
  text: 'Hello',
  created_at: '2026-07-10T00:00:00.000Z',
  delivered_at: null,
  read_at: null,
};

const makeInsertBuilder = () => {
  const builder: Record<string, jest.Mock> = {};
  Object.assign(builder, {
    insert: jest.fn(() => builder),
    select: jest.fn(() => builder),
    single: jest.fn(async () => ({ data: persistedMessage, error: null })),
  });
  return builder;
};

describe('messagingService push dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.functions = { invoke: jest.fn() };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabase.from.mockReturnValue(makeInsertBuilder());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('waits for the push invocation before resolving the persisted message', async () => {
    let resolveInvocation!: (value: { data: null; error: null }) => void;
    const invocation = new Promise<{ data: null; error: null }>((resolve) => {
      resolveInvocation = resolve;
    });
    mockSupabase.functions!.invoke.mockReturnValueOnce(invocation);

    let settled = false;
    const resultPromise = sendMessage('user-2', 'Hello').then((result) => {
      settled = true;
      return result;
    });

    for (let turn = 0; turn < 5 && !mockSupabase.functions!.invoke.mock.calls.length; turn += 1) {
      await Promise.resolve();
    }

    expect(mockSupabase.functions!.invoke).toHaveBeenCalledWith(
      'send-push-notification',
      { body: { messageId: persistedMessage.id } },
    );
    expect(settled).toBe(false);

    resolveInvocation({ data: null, error: null });
    await expect(resultPromise).resolves.toEqual({ message: persistedMessage, error: null });
  });

  it('keeps a persisted message successful when notification dispatch fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockSupabase.functions!.invoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Push unavailable'),
    });

    await expect(sendMessage('user-2', 'Hello')).resolves.toEqual({
      message: persistedMessage,
      error: null,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages] Push notification dispatch failed',
      expect.any(Error),
    );
  });
});
