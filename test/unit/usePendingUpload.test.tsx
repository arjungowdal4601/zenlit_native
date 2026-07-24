import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePendingUpload } from '../../src/hooks/usePendingUpload';
import { deleteStoredImage } from '../../src/services/storageService';
import {
  getPendingUploadRecords,
  registerPendingUpload,
} from '../../src/services/pendingUploadLedger';
import type { StoredImage } from '../../src/types/stored-image';
import { installMemoryStorage } from '../utils/memoryStorage';

jest.mock('../../src/services/storageService', () => ({
  deleteStoredImage: jest.fn(async () => ({ success: true, error: null })),
}));

const mockDeleteStoredImage = deleteStoredImage as jest.MockedFunction<typeof deleteStoredImage>;

installMemoryStorage();

const makeImage = (suffix: string): StoredImage => ({
  uploadId: `upload-${suffix}`,
  publicUrl: `https://cdn.example/profile-images/user-123/avatar-${suffix}.jpg`,
  bucket: 'profile-images',
  objectPath: `user-123/avatar-${suffix}.jpg`,
  width: 640,
  height: 640,
  size: 1024,
  mimeType: 'image/jpeg',
});

describe('usePendingUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adopts a replacement before deleting the superseded pending object', async () => {
    const first = makeImage('first');
    const second = makeImage('second');
    registerPendingUpload('user-123', first);
    registerPendingUpload('user-123', second);
    const { result } = renderHook(() => usePendingUpload());

    await act(async () => result.current.replace(first));
    await act(async () => result.current.replace(second));

    expect(result.current.image).toEqual(second);
    expect(mockDeleteStoredImage).toHaveBeenCalledWith(first);
  });

  it('deletes on explicit removal and clears pending state', async () => {
    const image = makeImage('remove');
    const { result } = renderHook(() => usePendingUpload());
    await act(async () => result.current.replace(image));

    await act(async () => result.current.discard());

    expect(result.current.image).toBeNull();
    expect(mockDeleteStoredImage).toHaveBeenCalledWith(image);
  });

  it('commits ledger metadata without deleting the database-referenced object', async () => {
    const image = makeImage('commit');
    registerPendingUpload('user-123', image);
    const { result, unmount } = renderHook(() => usePendingUpload());
    await act(async () => result.current.replace(image));

    act(() => result.current.commit());
    unmount();

    expect(result.current.image).toBeNull();
    expect(getPendingUploadRecords('user-123')).toEqual([]);
    expect(mockDeleteStoredImage).not.toHaveBeenCalled();
  });

  it('best-effort deletes an uncommitted object when the form unmounts', async () => {
    const image = makeImage('abandon');
    const { result, unmount } = renderHook(() => usePendingUpload());
    await act(async () => result.current.replace(image));

    unmount();

    await waitFor(() => expect(mockDeleteStoredImage).toHaveBeenCalledWith(image));
  });

  it('does not delete an image while a successful database write is still in flight', async () => {
    const image = makeImage('saving-success');
    registerPendingUpload('user-123', image);
    const { result, unmount } = renderHook(() => usePendingUpload());
    await act(async () => result.current.replace(image));
    const releasePersistence = result.current.beginPersistence();
    const commit = result.current.commit;

    unmount();
    expect(mockDeleteStoredImage).not.toHaveBeenCalled();

    commit();
    releasePersistence();

    expect(getPendingUploadRecords('user-123')).toEqual([]);
    expect(mockDeleteStoredImage).not.toHaveBeenCalled();
  });

  it('deletes after an in-flight database write fails following unmount', async () => {
    const image = makeImage('saving-failure');
    const { result, unmount } = renderHook(() => usePendingUpload());
    await act(async () => result.current.replace(image));
    const releasePersistence = result.current.beginPersistence();

    unmount();
    expect(mockDeleteStoredImage).not.toHaveBeenCalled();

    releasePersistence();

    await waitFor(() => expect(mockDeleteStoredImage).toHaveBeenCalledWith(image));
  });
});
