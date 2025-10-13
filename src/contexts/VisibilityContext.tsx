import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import type { SocialPlatformId } from '../constants/socialPlatforms';
import { DEFAULT_VISIBLE_PLATFORMS } from '../constants/socialPlatforms';
import { updateUserLocation, deleteUserLocation } from '../lib/database';

type VisibilityContextValue = {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  radiusKm: number;
  setRadiusKm: (value: number) => void;
  selectedAccounts: SocialPlatformId[];
  toggleAccount: (platformId: SocialPlatformId) => void;
  selectAll: () => void;
  deselectAll: () => void;
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
  const [isVisible, setIsVisible] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedAccounts, setSelectedAccounts] = useState<SocialPlatformId[]>(
    [...DEFAULT_VISIBLE_PLATFORMS],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      handleLocationUpdate();
    }
  }, [isVisible]);

  const handleLocationUpdate = async () => {
    if (isVisible) {
      if (Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateUserLocation(latitude, longitude);
          },
          (error) => {
            console.warn('Geolocation error:', error);
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
    }),
    [isVisible, radiusKm, selectedAccounts],
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};
