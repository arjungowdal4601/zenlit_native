import { logger } from './logger';

const HAS_SEEN_GET_STARTED_KEY = 'zenlit_has_seen_get_started';

const getBrowserStorage = () => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
  return globalThis.localStorage;
};

export const readHasSeenGetStarted = (): boolean => {
  try {
    const value = getBrowserStorage()?.getItem(HAS_SEEN_GET_STARTED_KEY);
    return value === 'true';
  } catch (error) {
    logger.warn('GetStarted', 'Failed to read landing preference', error);
    return false;
  }
};

export const persistHasSeenGetStarted = (): void => {
  try {
    getBrowserStorage()?.setItem(HAS_SEEN_GET_STARTED_KEY, 'true');
  } catch (error) {
    logger.warn('GetStarted', 'Failed to persist landing preference', error);
  }
};
