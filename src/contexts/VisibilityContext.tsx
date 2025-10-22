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
  const locationWatchRef = useRef<(() => void) | null>(null);
  const hasRequestedPermissionRef = useRef(false);
  const userForcedInvisibleRef = useRef(false);

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
      },
      async (error: LocationError) => {
        console.warn(`Geolocation refresh error (${getErrorName(error.code)}):`, error);
        if (error.code === 1) {
          setLocationPermissionDenied(true);
          await deleteUserLocation();
          if (locationWatchRef.current) {
            locationWatchRef.current();
            locationWatchRef.current = null;
          }
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
      try {
        const coords = await getCurrentLocation();
        await updateUserLocation(coords.latitude, coords.longitude);
        setLocationPermissionDenied(false);
        startLocationRefresh();
      } catch (error: any) {
        console.warn(`Geolocation error (${getErrorName(error.code)}):`, error);
        if (error.code === 1) {
          setLocationPermissionDenied(true);
          await deleteUserLocation();
          stopLocationRefresh();
        }
      }
    } else {
      await deleteUserLocation();
      setLocationPermissionDenied(false);
      stopLocationRefresh();
    }
  }, [isVisible, startLocationRefresh, stopLocationRefresh]);

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
        try {
          const coords = await getCurrentLocation();
          await updateUserLocation(coords.latitude, coords.longitude);
          setLocationPermissionDenied(false);
          if (autoEnable) {
            setIsVisible(true, 'auto');
          }
          startLocationRefresh();
          return true;
        } catch (error: any) {
          console.warn(`Location request error (${getErrorName(error.code)}):`, error);
          if (error.code === 1) {
            setLocationPermissionDenied(true);
            await deleteUserLocation();
            setIsVisible(false, 'auto');
          }
          return false;
        }
      } else {
        setLocationPermissionDenied(true);
        await deleteUserLocation();
        setIsVisible(false, 'auto');
        return false;
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      setLocationPermissionDenied(true);
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
      requestLocationPermission,
    }),
    [isVisible, radiusKm, selectedAccounts, locationPermissionDenied, setIsVisible, requestLocationPermission],
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};
