import React, { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import type { SocialPlatformId } from '../constants/socialPlatforms';
import { DEFAULT_VISIBLE_PLATFORMS } from '../constants/socialPlatforms';

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
