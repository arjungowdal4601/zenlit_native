import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import type { SocialPlatformId } from '../constants/socialPlatforms';
import { DEFAULT_VISIBLE_PLATFORMS } from '../constants/socialPlatforms';
import { updateUserLocation, deleteUserLocation, updateAllConversationAnonymity } from '../lib/database';

const LOCATION_REFRESH_INTERVAL = 60000;
const GEO_OPTS: PositionOptions = {
  // High accuracy can cause long waits/timeouts on web; prefer balanced defaults
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 60000,
};

const getErrorName = (code: number): string => {
  switch (code) {
    case 1:
      return 'PERMISSION_DENIED';
    case 2:
      return 'POSITION_UNAVAILABLE';
    case 3:
      return 'TIMEOUT';
    default:
      return 'UNKNOWN';
  }
};

type LocationPermissionRequestOptions = {
  autoEnable?: boolean;
};

type VisibilityContextValue = {
  isVisible: boolean;
  setIsVisible: (value: boolean, source?: 'user' | 'auto') => void;
  radiusKm: number;
  setRadiusKm: (value: number) => void;
  selectedAccounts: SocialPlatformId[];
  toggleAccount: (platformId: SocialPlatformId) => void;
  selectAll: () => void;
  deselectAll: () => void;
  locationPermissionDenied: boolean;
  requestLocationPermission: (options?: LocationPermissionRequestOptions) => Promise<boolean>;
};

const VisibilityContext = createContext<VisibilityContextValue | undefined>(undefined);

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
};

export const VisibilityProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isVisible, setIsVisibleState] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedAccounts, setSelectedAccounts] = useState<SocialPlatformId[]>(
    [...DEFAULT_VISIBLE_PLATFORMS],
  );
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  // Use ReturnType<typeof setInterval> for cross-platform compatibility
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRequestedPermissionRef = useRef(false);
  const userForcedInvisibleRef = useRef(false);

  const stopLocationRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const startLocationRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateUserLocation(latitude, longitude);
            await updateAllConversationAnonymity();
          },
          async (error) => {
            console.warn(`Geolocation refresh error (${getErrorName(error.code)}):`, error);
            if (error.code === 1 /* PERMISSION_DENIED */) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
            }
          },
          GEO_OPTS
        );
      }
    }, LOCATION_REFRESH_INTERVAL);
  }, []);

  const setIsVisible = useCallback(
    (value: boolean, source: 'user' | 'auto' = 'user') => {
      if (source === 'auto' && value && userForcedInvisibleRef.current) {
        return;
      }

      setIsVisibleState((prev) => (prev === value ? prev : value));

      if (source === 'user') {
        userForcedInvisibleRef.current = !value;
      }
    },
    [],
  );

  const handleLocationUpdate = useCallback(async () => {
    if (isVisible) {
      if (Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateUserLocation(latitude, longitude);
            await updateAllConversationAnonymity();
            setLocationPermissionDenied(false);
            startLocationRefresh();
          },
          async (error) => {
            console.warn(`Geolocation error (${getErrorName(error.code)}):`, error);
            if (error.code === 1 /* PERMISSION_DENIED */) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              stopLocationRefresh();
            }
          },
          GEO_OPTS
        );
      }
    } else {
      await deleteUserLocation();
      await updateAllConversationAnonymity();
      setLocationPermissionDenied(false);
      stopLocationRefresh();
    }
  }, [isVisible, startLocationRefresh, stopLocationRefresh]);

  useEffect(() => {
    handleLocationUpdate();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [handleLocationUpdate]);

  const toggleAccount = (platformId: SocialPlatformId) => {
    setSelectedAccounts((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const selectAll = () => {
    setSelectedAccounts([...DEFAULT_VISIBLE_PLATFORMS]);
  };

  const deselectAll = () => {
    setSelectedAccounts([]);
  };

  const requestLocationPermission = useCallback(async (
    options: LocationPermissionRequestOptions = {},
  ): Promise<boolean> => {
    const { autoEnable = true } = options;

    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      hasRequestedPermissionRef.current = true;

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateUserLocation(latitude, longitude);
            await updateAllConversationAnonymity();
            setLocationPermissionDenied(false);
            if (autoEnable) {
              setIsVisible(true, 'auto');
            }
            startLocationRefresh();
            resolve(true);
          },
          async (error) => {
            console.warn(`Location request error (${getErrorName(error.code)}):`, error);
            if (error.code === 1 /* PERMISSION_DENIED */) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              setIsVisible(false, 'auto');
            }
            resolve(false);
          },
          GEO_OPTS
        );
      });
    }
    return false;
  }, [setIsVisible, startLocationRefresh]);

  useEffect(() => {
    if (!hasRequestedPermissionRef.current) {
      hasRequestedPermissionRef.current = true;
      requestLocationPermission({ autoEnable: true });
    }
  }, [requestLocationPermission]);

  const value = useMemo(
    () => ({
      isVisible,
      setIsVisible,
      radiusKm,
      setRadiusKm,
      selectedAccounts,
      toggleAccount,
      selectAll,
      deselectAll,
      locationPermissionDenied,
      requestLocationPermission,
    }),
    [isVisible, radiusKm, selectedAccounts, locationPermissionDenied, setIsVisible, requestLocationPermission],
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};
