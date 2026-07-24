import { useCallback, useEffect, useRef, useState } from 'react';

import type { StoredImage } from '../types/stored-image';
import { deleteStoredImage } from '../services/storageService';
import {
  markPendingUploadCommitted,
  pendingUploadLedgerConstants,
  renewPendingUploadLease,
} from '../services/pendingUploadLedger';

export const usePendingUpload = (initialImage: StoredImage | null = null) => {
  const [image, setImage] = useState<StoredImage | null>(initialImage);
  const imageRef = useRef<StoredImage | null>(initialImage);
  const persistenceRef = useRef({ cleanupAfterRelease: false, locks: 0 });
  const mountedRef = useRef(true);

  const replace = useCallback(async (nextImage: StoredImage | null) => {
    if (persistenceRef.current.locks > 0) {
      throw new Error('Image changes are locked while this form is saving');
    }
    const previousImage = imageRef.current;
    if (previousImage?.objectPath === nextImage?.objectPath) return;

    imageRef.current = nextImage;
    if (mountedRef.current) setImage(nextImage);
    if (nextImage) renewPendingUploadLease(nextImage);

    if (previousImage) {
      await deleteStoredImage(previousImage);
    }
  }, []);

  const discard = useCallback(async () => {
    if (persistenceRef.current.locks > 0) return;
    const pendingImage = imageRef.current;
    imageRef.current = null;
    if (mountedRef.current) setImage(null);
    if (pendingImage) {
      await deleteStoredImage(pendingImage);
    }
  }, []);

  const commit = useCallback(() => {
    const pendingImage = imageRef.current;
    imageRef.current = null;
    persistenceRef.current.cleanupAfterRelease = false;
    if (mountedRef.current) setImage(null);
    if (pendingImage) {
      markPendingUploadCommitted(pendingImage);
    }
  }, []);

  const beginPersistence = useCallback(() => {
    persistenceRef.current.locks += 1;
    let released = false;

    return () => {
      if (released) return;
      released = true;
      persistenceRef.current.locks = Math.max(0, persistenceRef.current.locks - 1);

      if (
        persistenceRef.current.locks === 0 &&
        persistenceRef.current.cleanupAfterRelease
      ) {
        persistenceRef.current.cleanupAfterRelease = false;
        const pendingImage = imageRef.current;
        imageRef.current = null;
        if (pendingImage) {
          void deleteStoredImage(pendingImage);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!image) return;
    renewPendingUploadLease(image);
    const interval = globalThis.setInterval(
      () => renewPendingUploadLease(image),
      pendingUploadLedgerConstants.heartbeatIntervalMs,
    );
    return () => globalThis.clearInterval(interval);
  }, [image]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (persistenceRef.current.locks > 0) {
        persistenceRef.current.cleanupAfterRelease = true;
        return;
      }

      const pendingImage = imageRef.current;
      imageRef.current = null;
      if (pendingImage) {
        void deleteStoredImage(pendingImage);
      }
    };
  }, []);

  return { image, replace, discard, commit, beginPersistence };
};
