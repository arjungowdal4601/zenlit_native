import { supabase } from '../../src/lib/supabase';
import {
  cleanupPendingUploads,
  cleanupPendingUploadsBeforeLogout,
  getPendingUploadRecords,
  markPendingUploadCommitted,
  queuePendingUploadDeletion,
  registerPendingUpload,
  renewOwnedPendingUploadLeases,
  startPendingUploadLifecycle,
} from '../../src/services/pendingUploadLedger';
import type { StoredImage } from '../../src/types/stored-image';
import { installMemoryStorage } from '../utils/memoryStorage';

const mockSupabase = supabase as unknown as {
  storage: { from: jest.Mock };
};

const DAY = 24 * 60 * 60 * 1000;

installMemoryStorage();

const makeImage = (suffix = 'one'): StoredImage => ({
  uploadId: `upload-${suffix}`,
  publicUrl: `https://cdn.example/profile-images/user-123/avatar-${suffix}.jpg`,
  bucket: 'profile-images',
  objectPath: `user-123/avatar-${suffix}.jpg`,
  width: 640,
  height: 640,
  size: 1024,
  mimeType: 'image/jpeg',
});

describe('pending upload ledger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('persists only metadata and removes committed uploads without deleting Storage', () => {
    const image = makeImage();
    registerPendingUpload('user-123', image, { now: 100, tabId: 'tab-a' });

    const serialized = Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index);
      return key ? localStorage.getItem(key) : null;
    }).join('');
    expect(serialized).toContain(image.publicUrl);
    expect(serialized).not.toContain('base64');
    expect(serialized).not.toContain('blob:');
    expect(getPendingUploadRecords('user-123')[0]).toMatchObject({
      ...image,
      kind: 'pending',
      userId: 'user-123',
      ownerTabId: 'tab-a',
    });

    markPendingUploadCommitted(image);

    expect(getPendingUploadRecords('user-123')).toEqual([]);
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });

  it('does not treat a leased upload as abandoned, then removes it after 24 hours and lease expiry', async () => {
    const image = makeImage();
    registerPendingUpload('user-123', image, {
      now: 0,
      tabId: 'tab-a',
      leaseMs: 2 * DAY,
    });
    const remove = jest.fn(async () => ({ data: null, error: null }));
    mockSupabase.storage.from.mockReturnValue({ remove });

    const active = await cleanupPendingUploads('user-123', { now: DAY + 1 });

    expect(active).toEqual({ deleted: 0, failed: 0 });
    expect(remove).not.toHaveBeenCalled();

    const abandoned = await cleanupPendingUploads('user-123', { now: 2 * DAY + 1 });

    expect(abandoned).toEqual({ deleted: 1, failed: 0 });
    expect(remove).toHaveBeenCalledWith([image.objectPath]);
    expect(getPendingUploadRecords('user-123')).toEqual([]);
  });

  it('renews leases only for pending records owned by the active tab', () => {
    registerPendingUpload('user-123', makeImage('a'), {
      now: 0,
      tabId: 'tab-a',
      leaseMs: 100,
    });
    registerPendingUpload('user-123', makeImage('b'), {
      now: 0,
      tabId: 'tab-b',
      leaseMs: 100,
    });

    renewOwnedPendingUploadLeases('user-123', {
      now: 50,
      tabId: 'tab-a',
      leaseMs: 1_000,
    });

    const records = getPendingUploadRecords('user-123');
    expect(records.find(({ uploadId }) => uploadId === 'upload-a')?.leaseUntil).toBe(1_050);
    expect(records.find(({ uploadId }) => uploadId === 'upload-b')?.leaseUntil).toBe(100);
  });

  it('retains a failed deletion for retry and removes it only after Storage succeeds', async () => {
    const image = makeImage();
    registerPendingUpload('user-123', image, { now: 100, tabId: 'tab-a' });
    queuePendingUploadDeletion('user-123', image, { now: 200, tabId: 'tab-a' });
    const remove = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: new Error('Network unavailable') })
      .mockResolvedValueOnce({ data: null, error: null });
    mockSupabase.storage.from.mockReturnValue({ remove });

    await expect(cleanupPendingUploads('user-123', { now: 300 })).resolves.toEqual({
      deleted: 0,
      failed: 1,
    });
    expect(getPendingUploadRecords('user-123')).toEqual([
      expect.objectContaining({ objectPath: image.objectPath, kind: 'deletion' }),
    ]);

    await expect(cleanupPendingUploads('user-123', { now: 400 })).resolves.toEqual({
      deleted: 1,
      failed: 0,
    });
    expect(getPendingUploadRecords('user-123')).toEqual([]);
  });

  it('deletes even active pending objects before logout', async () => {
    const image = makeImage();
    registerPendingUpload('user-123', image, {
      now: Date.now(),
      tabId: 'tab-a',
      leaseMs: DAY,
    });
    const remove = jest.fn(async () => ({ data: null, error: null }));
    mockSupabase.storage.from.mockReturnValue({ remove });

    await expect(cleanupPendingUploadsBeforeLogout('user-123')).resolves.toEqual({
      deleted: 1,
      failed: 0,
    });
    expect(remove).toHaveBeenCalledWith([image.objectPath]);
  });

  it('retries queued deletions on startup, focus, and reconnect and removes its listeners', async () => {
    jest.useFakeTimers();
    const listeners = new Map<string, () => void>();
    const addEventListener = jest.fn((name: string, listener: () => void) => {
      listeners.set(name, listener);
    });
    const removeEventListener = jest.fn((name: string) => listeners.delete(name));
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener, removeEventListener },
    });
    const remove = jest.fn(async () => ({ data: null, error: null }));
    mockSupabase.storage.from.mockReturnValue({ remove });
    const startupImage = makeImage('startup');
    registerPendingUpload('user-123', startupImage);
    queuePendingUploadDeletion('user-123', startupImage);

    const dispose = startPendingUploadLifecycle('user-123');
    await Promise.resolve();
    await Promise.resolve();
    expect(remove).toHaveBeenCalledWith([startupImage.objectPath]);

    const reconnectImage = makeImage('reconnect');
    registerPendingUpload('user-123', reconnectImage);
    queuePendingUploadDeletion('user-123', reconnectImage);
    listeners.get('online')?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(remove).toHaveBeenCalledWith([reconnectImage.objectPath]);

    listeners.get('focus')?.();
    dispose();
    expect(addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('rejects ledger records outside the UID-owned folder', () => {
    expect(() =>
      registerPendingUpload('user-123', {
        ...makeImage(),
        objectPath: 'another-user/avatar.jpg',
      }),
    ).toThrow('not owned');
    expect(getPendingUploadRecords('user-123')).toEqual([]);
  });
});
