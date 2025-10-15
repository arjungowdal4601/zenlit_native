import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import type { SocialPlatformId } from '../constants/socialPlatforms';
import { DEFAULT_VISIBLE_PLATFORMS } from '../constants/socialPlatforms';
import { updateUserLocation, deleteUserLocation, updateAllConversationAnonymity } from '../lib/database';

const LOCATION_REFRESH_INTERVAL = 60000;

type VisibilityContextValue = {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  radiusKm: number;
  setRadiusKm: (value: number) => void;
  selectedAccounts: SocialPlatformId[];
  toggleAccount: (platformId: SocialPlatformId) => void;
  selectAll: () => void;
  deselectAll: () => void;
  locationPermissionDenied: boolean;
  requestLocationPermission: () => Promise<boolean>;
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
  const [isVisible, setIsVisible] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedAccounts, setSelectedAccounts] = useState<SocialPlatformId[]>(
    [...DEFAULT_VISIBLE_PLATFORMS],
  );
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && isVisible) {
      handleLocationUpdate();
    } else if (!isVisible) {
      stopLocationRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isVisible]);

  const startLocationRefresh = () => {
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
            console.warn('Geolocation refresh error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      }
    }, LOCATION_REFRESH_INTERVAL);
  };

  const stopLocationRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const handleLocationUpdate = async () => {
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
            console.warn('Geolocation error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              stopLocationRefresh();
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      }
    } else {
      await deleteUserLocation();
      await updateAllConversationAnonymity();
      setLocationPermissionDenied(false);
      stopLocationRefresh();
    }
  };

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

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateUserLocation(latitude, longitude);
            await updateAllConversationAnonymity();
            setLocationPermissionDenied(false);
            setIsVisible(true);
            startLocationRefresh();
            resolve(true);
          },
          async (error) => {
            console.warn('Location permission denied:', error);
            if (error.code === error.PERMISSION_DENIED) {
              setLocationPermissionDenied(true);
              await deleteUserLocation();
              await updateAllConversationAnonymity();
              setIsVisible(false);
            }
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });
    }
    return false;
  };

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
    [isVisible, radiusKm, selectedAccounts, locationPermissionDenied],
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};
