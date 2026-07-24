import { supabase } from '../lib/supabase';
import type { StorageBucket, StoredImage } from '../types/stored-image';

const LEDGER_VERSION = 1;
const LEDGER_KEY_PREFIX = `zenlit.pending-uploads.v${LEDGER_VERSION}:`;
const TAB_ID_KEY = `zenlit.pending-upload-tab.v${LEDGER_VERSION}`;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const LEASE_DURATION_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const ALLOWED_BUCKETS: readonly StorageBucket[] = [
  'profile-images',
  'post-images',
  'feedback-images',
];

export type PendingUploadRecord = StoredImage & {
  kind: 'pending' | 'deletion';
  userId: string;
  createdAt: number;
  lastTouchedAt: number;
  ownerTabId: string;
  leaseUntil: number;
};

type LedgerClockOptions = {
  now?: number;
  tabId?: string;
  leaseMs?: number;
};

type CleanupOptions = {
  includeActive?: boolean;
  now?: number;
};

const memoryStorage = new Map<string, string>();
let fallbackTabId: string | null = null;

const randomId = (): string => {
  const cryptoValue = globalThis.crypto;
  if (cryptoValue?.randomUUID) {
    return cryptoValue.randomUUID();
  }

  if (cryptoValue?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoValue.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const getLocalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const readValue = (key: string): string | null => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value !== null) return value;
    } catch {
      // Fall through to the in-memory web-test/native fallback.
    }
  }
  return memoryStorage.get(key) ?? null;
};

const writeValue = (key: string, value: string) => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // Fall through to the in-memory web-test/native fallback.
    }
  }
  memoryStorage.set(key, value);
};

const removeValue = (key: string) => {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Also remove the fallback value below.
    }
  }
  memoryStorage.delete(key);
};

const ledgerUserPrefix = (userId: string) =>
  `${LEDGER_KEY_PREFIX}${encodeURIComponent(userId)}:`;

const ledgerRecordKey = (userId: string, uploadId: string) =>
  `${ledgerUserPrefix(userId)}${encodeURIComponent(uploadId)}`;

const listKeys = (prefix: string): string[] => {
  const keys = new Set<string>();
  const storage = getLocalStorage();
  if (storage) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(prefix)) keys.add(key);
      }
    } catch {
      // Also inspect the fallback store below.
    }
  }
  for (const key of memoryStorage.keys()) {
    if (key.startsWith(prefix)) keys.add(key);
  }
  return Array.from(keys);
};

const isStorageBucket = (value: unknown): value is StorageBucket =>
  typeof value === 'string' && ALLOWED_BUCKETS.includes(value as StorageBucket);

const isOwnedObjectPath = (objectPath: string, userId: string) =>
  objectPath.startsWith(`${userId}/`) && !objectPath.includes('..');

const isStoredImageRecord = (value: unknown, userId: string): value is PendingUploadRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<PendingUploadRecord>;
  return (
    (record.kind === 'pending' || record.kind === 'deletion') &&
    record.userId === userId &&
    typeof record.uploadId === 'string' &&
    typeof record.publicUrl === 'string' &&
    isStorageBucket(record.bucket) &&
    typeof record.objectPath === 'string' &&
    isOwnedObjectPath(record.objectPath, userId) &&
    typeof record.width === 'number' &&
    typeof record.height === 'number' &&
    typeof record.size === 'number' &&
    record.mimeType === 'image/jpeg' &&
    typeof record.createdAt === 'number' &&
    typeof record.lastTouchedAt === 'number' &&
    typeof record.ownerTabId === 'string' &&
    typeof record.leaseUntil === 'number'
  );
};

const readRecords = (userId: string): PendingUploadRecord[] => {
  const records: PendingUploadRecord[] = [];
  for (const key of listKeys(ledgerUserPrefix(userId))) {
    const raw = readValue(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isStoredImageRecord(parsed, userId)) records.push(parsed);
    } catch {
      // Ignore malformed client metadata; it never contains image bytes.
    }
  }
  return records;
};

const writeRecord = (record: PendingUploadRecord) =>
  writeValue(ledgerRecordKey(record.userId, record.uploadId), JSON.stringify(record));

const removeRecord = (record: Pick<PendingUploadRecord, 'userId' | 'uploadId'>) =>
  removeValue(ledgerRecordKey(record.userId, record.uploadId));

export const getPendingUploadTabId = (): string => {
  try {
    const existing = globalThis.sessionStorage?.getItem(TAB_ID_KEY);
    if (existing) return existing;
    const next = randomId();
    globalThis.sessionStorage?.setItem(TAB_ID_KEY, next);
    return next;
  } catch {
    if (!fallbackTabId) fallbackTabId = randomId();
    return fallbackTabId;
  }
};

export const getImageOwnerId = (image: Pick<StoredImage, 'objectPath'>): string | null => {
  const separatorIndex = image.objectPath.indexOf('/');
  if (separatorIndex <= 0) return null;
  const userId = image.objectPath.slice(0, separatorIndex);
  return isOwnedObjectPath(image.objectPath, userId) ? userId : null;
};

export const getPendingUploadRecords = (userId: string): PendingUploadRecord[] =>
  readRecords(userId);

export const registerPendingUpload = (
  userId: string,
  image: StoredImage,
  options: LedgerClockOptions = {},
) => {
  if (!isOwnedObjectPath(image.objectPath, userId)) {
    throw new Error('Storage object path is not owned by the authenticated user');
  }

  const now = options.now ?? Date.now();
  const tabId = options.tabId ?? getPendingUploadTabId();
  const next: PendingUploadRecord = {
    ...image,
    kind: 'pending',
    userId,
    createdAt: now,
    lastTouchedAt: now,
    ownerTabId: tabId,
    leaseUntil: now + (options.leaseMs ?? LEASE_DURATION_MS),
  };
  readRecords(userId)
    .filter((record) => record.uploadId === image.uploadId || record.objectPath === image.objectPath)
    .forEach(removeRecord);
  writeRecord(next);
};

export const renewPendingUploadLease = (
  image: Pick<StoredImage, 'uploadId' | 'objectPath'>,
  options: LedgerClockOptions = {},
) => {
  const userId = getImageOwnerId(image);
  if (!userId) return;
  const now = options.now ?? Date.now();
  const tabId = options.tabId ?? getPendingUploadTabId();
  const record = readRecords(userId).find(
    (candidate) => candidate.kind === 'pending' && candidate.uploadId === image.uploadId,
  );
  if (!record) return;
  writeRecord({
    ...record,
    lastTouchedAt: now,
    ownerTabId: tabId,
    leaseUntil: now + (options.leaseMs ?? LEASE_DURATION_MS),
  });
};

export const renewOwnedPendingUploadLeases = (
  userId: string,
  options: LedgerClockOptions = {},
) => {
  const now = options.now ?? Date.now();
  const tabId = options.tabId ?? getPendingUploadTabId();
  readRecords(userId)
    .filter((record) => record.kind === 'pending' && record.ownerTabId === tabId)
    .forEach((record) =>
      writeRecord({
        ...record,
        lastTouchedAt: now,
        leaseUntil: now + (options.leaseMs ?? LEASE_DURATION_MS),
      }),
    );
};

export const removePendingUploadRecord = (
  image: Pick<StoredImage, 'uploadId' | 'objectPath'>,
) => {
  const userId = getImageOwnerId(image);
  if (!userId) return;
  readRecords(userId)
    .filter(
      (record) => record.uploadId === image.uploadId || record.objectPath === image.objectPath,
    )
    .forEach(removeRecord);
};

export const markPendingUploadCommitted = removePendingUploadRecord;

export const queuePendingUploadDeletion = (
  userId: string,
  image: StoredImage,
  options: LedgerClockOptions = {},
) => {
  if (!isOwnedObjectPath(image.objectPath, userId)) {
    throw new Error('Storage object path is not owned by the authenticated user');
  }

  const now = options.now ?? Date.now();
  const tabId = options.tabId ?? getPendingUploadTabId();
  const existing = readRecords(userId);
  const matching = existing.find(
    (record) => record.uploadId === image.uploadId || record.objectPath === image.objectPath,
  );
  const queued: PendingUploadRecord = {
    ...(matching ?? image),
    kind: 'deletion',
    userId,
    createdAt: matching?.createdAt ?? now,
    lastTouchedAt: now,
    ownerTabId: matching?.ownerTabId ?? tabId,
    leaseUntil: 0,
  };
  existing
    .filter(
      (record) => record.uploadId === image.uploadId || record.objectPath === image.objectPath,
    )
    .forEach(removeRecord);
  writeRecord(queued);
};

const removeRecordObject = async (record: PendingUploadRecord): Promise<boolean> => {
  const { error } = await supabase.storage.from(record.bucket).remove([record.objectPath]);
  return !error;
};

export const cleanupPendingUploads = async (
  userId: string,
  options: CleanupOptions = {},
): Promise<{ deleted: number; failed: number }> => {
  const now = options.now ?? Date.now();
  const due = readRecords(userId).filter(
    (record) =>
      record.kind === 'deletion' ||
      options.includeActive === true ||
      (now - record.createdAt > STALE_AFTER_MS && record.leaseUntil <= now),
  );
  let deleted = 0;
  let failed = 0;

  for (const record of due) {
    const latest = readRecords(userId).find(
      (candidate) => candidate.uploadId === record.uploadId,
    );
    if (!latest) continue;
    const stillDue =
      latest.kind === 'deletion' ||
      options.includeActive === true ||
      (now - latest.createdAt > STALE_AFTER_MS && latest.leaseUntil <= now);
    if (!stillDue) continue;

    try {
      const removed = await removeRecordObject(latest);
      if (removed) {
        readRecords(userId)
          .filter((candidate) => candidate.objectPath === latest.objectPath)
          .forEach(removeRecord);
        deleted += 1;
      } else {
        writeRecord({ ...latest, kind: 'deletion', leaseUntil: 0, lastTouchedAt: now });
        failed += 1;
      }
    } catch {
      writeRecord({ ...latest, kind: 'deletion', leaseUntil: 0, lastTouchedAt: now });
      failed += 1;
    }
  }

  return { deleted, failed };
};

export const cleanupPendingUploadsBeforeLogout = (userId: string) =>
  cleanupPendingUploads(userId, { includeActive: true });

export const startPendingUploadLifecycle = (userId: string): (() => void) => {
  let disposed = false;
  const runCleanup = () => {
    if (!disposed) void cleanupPendingUploads(userId);
  };
  const heartbeat = () => {
    if (disposed) return;
    renewOwnedPendingUploadLeases(userId);
    void cleanupPendingUploads(userId);
  };

  runCleanup();
  const interval = globalThis.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
  const eventTarget = typeof window === 'undefined' ? null : window;
  eventTarget?.addEventListener('focus', heartbeat);
  eventTarget?.addEventListener('online', runCleanup);

  return () => {
    disposed = true;
    globalThis.clearInterval(interval);
    eventTarget?.removeEventListener('focus', heartbeat);
    eventTarget?.removeEventListener('online', runCleanup);
  };
};

export const pendingUploadLedgerConstants = {
  heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
  leaseDurationMs: LEASE_DURATION_MS,
  staleAfterMs: STALE_AFTER_MS,
};
