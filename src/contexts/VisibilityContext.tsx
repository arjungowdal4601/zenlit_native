import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { SocialPlatformId } from '../constants/nearbyUsers';
import { orderedSocialPlatforms } from '../constants/socialPlatforms';

type VisibilityContextValue = {
  isVisible: boolean;
  selectedPlatforms: SocialPlatformId[];
  toggleVisibility: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  togglePlatform: (id: SocialPlatformId) => void;
};

const VisibilityContext = createContext<VisibilityContextValue | undefined>(undefined);

type VisibilityProviderProps = {
  children: ReactNode;
};

export const VisibilityProvider: React.FC<VisibilityProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatformId[]>(
    orderedSocialPlatforms.map((platform) => platform.id)
  );

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  const selectAll = () => {
    setSelectedPlatforms(orderedSocialPlatforms.map((platform) => platform.id));
  };

  const deselectAll = () => {
    setSelectedPlatforms([]);
  };

  const togglePlatform = (id: SocialPlatformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((platformId) => platformId !== id) : [...prev, id]
    );
  };

  const value = useMemo(
    () => ({ isVisible, selectedPlatforms, toggleVisibility, selectAll, deselectAll, togglePlatform }),
    [isVisible, selectedPlatforms]
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);

  if (!context) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }

  return context;
};
