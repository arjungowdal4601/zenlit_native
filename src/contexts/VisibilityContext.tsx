import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { PropsWithChildren } from 'react';

import type { SocialPlatformId } from '../constants/socialPlatforms';
import { DEFAULT_VISIBLE_PLATFORMS } from '../constants/socialPlatforms';
import { updateUserLocation, deleteUserLocation } from '../lib/database';
import {
  getCurrentLocation,
  watchLocation,
  requestLocationPermission as requestLocationPermissionService,
  type LocationError,
} from '../services/locationService';

const LOCATION_REFRESH_INTERVAL = 60000;

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

export type LocationStatus =
  | 'not-attempted'
  | 'fetching'
  | 'success'
  | 'timeout'
  | 'position-unavailable'
  | 'permission-denied';

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
  locationStatus: LocationStatus;
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
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('not-attempted');
  const locationWatchRef = useRef<(() => void) | null>(null);
  const hasRequestedPermissionRef = useRef(false);
  const userForcedInvisibleRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const stopLocationRefresh = useCallback(() => {
    if (locationWatchRef.current) {
      locationWatchRef.current();
      locationWatchRef.current = null;
    }
  }, []);

  const startLocationRefresh = useCallback(() => {
    if (locationWatchRef.current) {
      locationWatchRef.current();
    }

    locationWatchRef.current = watchLocation(
      async (coords) => {
        await updateUserLocation(coords.latitude, coords.longitude);
        setLocationStatus('success');
        retryCountRef.current = 0;
      },
      async (error: LocationError) => {
        console.warn(`Geolocation refresh error (${getErrorName(error.code)}):`, error);
        if (error.code === 1) {
          setLocationPermissionDenied(true);
          setLocationStatus('permission-denied');
          await deleteUserLocation();
          if (locationWatchRef.current) {
            locationWatchRef.current();
            locationWatchRef.current = null;
          }
        } else if (error.code === 2) {
          setLocationStatus('position-unavailable');
        } else if (error.code === 3) {
          setLocationStatus('timeout');
        }
      },
      LOCATION_REFRESH_INTERVAL
    );
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
      setLocationStatus('fetching');
      try {
        const coords = await getCurrentLocation();
        await updateUserLocation(coords.latitude, coords.longitude);
        setLocationPermissionDenied(false);
        setLocationStatus('success');
        retryCountRef.current = 0;
        startLocationRefresh();
      } catch (error: any) {
        console.warn(`Geolocation error (${getErrorName(error.code)}):`, error);
        if (error.code === 1) {
          setLocationPermissionDenied(true);
          setLocationStatus('permission-denied');
          await deleteUserLocation();
          stopLocationRefresh();
        } else if (error.code === 2) {
          setLocationStatus('position-unavailable');
          retryCountRef.current += 1;
          if (retryCountRef.current < maxRetries) {
            setTimeout(() => handleLocationUpdate(), 2000 * retryCountRef.current);
          }
        } else if (error.code === 3) {
          setLocationStatus('timeout');
          retryCountRef.current += 1;
          if (retryCountRef.current < maxRetries) {
            setTimeout(() => handleLocationUpdate(), 2000 * retryCountRef.current);
          }
        }
      }
    } else {
      await deleteUserLocation();
      setLocationPermissionDenied(false);
      setLocationStatus('not-attempted');
      stopLocationRefresh();
    }
  }, [isVisible, startLocationRefresh, stopLocationRefresh, maxRetries]);

  useEffect(() => {
    handleLocationUpdate();

    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current();
        locationWatchRef.current = null;
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
    hasRequestedPermissionRef.current = true;

    try {
      const permissionStatus = await requestLocationPermissionService();

      if (permissionStatus === 'granted' || permissionStatus === 'undetermined') {
        setLocationStatus('fetching');
        try {
          const coords = await getCurrentLocation();
          await updateUserLocation(coords.latitude, coords.longitude);
          setLocationPermissionDenied(false);
          setLocationStatus('success');
          retryCountRef.current = 0;
          if (autoEnable) {
            setIsVisible(true, 'auto');
          }
          startLocationRefresh();
          return true;
        } catch (error: any) {
          console.warn(`Location request error (${getErrorName(error.code)}):`, error);
          if (error.code === 1) {
            setLocationPermissionDenied(true);
            setLocationStatus('permission-denied');
            await deleteUserLocation();
            setIsVisible(false, 'auto');
          } else if (error.code === 2) {
            setLocationStatus('position-unavailable');
          } else if (error.code === 3) {
            setLocationStatus('timeout');
          }
          return false;
        }
      } else {
        setLocationPermissionDenied(true);
        setLocationStatus('permission-denied');
        await deleteUserLocation();
        setIsVisible(false, 'auto');
        return false;
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      setLocationPermissionDenied(true);
      setLocationStatus('permission-denied');
      return false;
    }
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
      locationStatus,
      requestLocationPermission,
    }),
    [isVisible, radiusKm, selectedAccounts, locationPermissionDenied, locationStatus, setIsVisible, requestLocationPermission],
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};
