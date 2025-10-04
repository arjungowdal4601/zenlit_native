"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { DEFAULT_VISIBLE_PLATFORMS, type SocialPlatformId } from '@/constants/socialPlatforms';
import { handleLocationVisibilityToggle, type StoredLocationData } from '@/utils/locationService';
import { supabase } from '@/utils/supabaseClient';

interface VisibilityContextType {
  isVisible: boolean;
  selectedAccounts: SocialPlatformId[];
  setIsVisible: Dispatch<SetStateAction<boolean>>;
  setSelectedAccounts: Dispatch<SetStateAction<SocialPlatformId[]>>;
  locationData: StoredLocationData | null;
  locationError: string | null;
  isLoadingLocation: boolean;
  // Expose current user id to consumers (feed, radar, etc.)
  currentUserId: string | null;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
};

interface VisibilityProviderProps {
  children: ReactNode;
}

export const VisibilityProvider = ({ children }: VisibilityProviderProps) => {
  const [isVisible, setIsVisible] = useState(false); // Start with false to trigger location request
  const [selectedAccounts, setSelectedAccounts] = useState<SocialPlatformId[]>(() => [...DEFAULT_VISIBLE_PLATFORMS]);
  const [locationData, setLocationData] = useState<StoredLocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setCurrentUserId(null);
      }
    };
    getCurrentUser();
  }, []);

  // Handle visibility toggle with location access
  const handleVisibilityToggle = async (newVisibility: boolean) => {
    console.log('handleVisibilityToggle called with:', newVisibility, 'currentUserId:', currentUserId);
    
    if (!currentUserId) return;

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (newVisibility) {
        console.log('Requesting location access...');
        const storedLocation = await handleLocationVisibilityToggle(currentUserId, true);
        console.log('Location stored:', storedLocation);
        setLocationData(storedLocation);
      } else {
        console.log('Turning off visibility, clearing location data');
        setLocationData(null);
        await handleLocationVisibilityToggle(currentUserId, false);
      }
    } catch (error) {
      console.error('Error in handleVisibilityToggle:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to access location');
      setIsVisible(false); // Revert visibility if location access fails
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Override setIsVisible to use our custom handler
  const customSetIsVisible = (value: SetStateAction<boolean>) => {
    const newValue = typeof value === 'function' ? value(isVisible) : value;
    
    // Update UI state immediately for responsive feedback
    setIsVisible(newValue);
    
    // Then handle the async location logic
    if (currentUserId) {
      handleVisibilityToggle(newValue);
    }
  };

  // Auto-trigger location request when user ID becomes available and visibility is ON
  useEffect(() => {
    if (isVisible && currentUserId && !locationData && !isLoadingLocation) {
      console.log('Auto requesting location: visibility is ON and userId is available');
      handleVisibilityToggle(true);
    }
  }, [isVisible, currentUserId, locationData, isLoadingLocation]);

  const value = useMemo(
    () => ({
      isVisible,
      selectedAccounts,
      setIsVisible: customSetIsVisible,
      setSelectedAccounts,
      locationData,
      locationError,
      isLoadingLocation,
      currentUserId,
    }),
    [isVisible, selectedAccounts, locationData, locationError, isLoadingLocation, currentUserId],
  );

  return (
    <VisibilityContext.Provider value={value}>
      {children}
    </VisibilityContext.Provider>
  );
};
