import { useCallback, useEffect, useRef, useState } from 'react';

import { checkUsernameAvailability } from '../services/profileService';
import { validateUsername } from '../utils/profileValidation';

type UseUsernameAvailabilityOptions = {
  currentUserId: string | null;
  username: string;
};

export const useUsernameAvailability = ({
  currentUserId,
  username,
}: UseUsernameAvailabilityOptions) => {
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const usernameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameCheckIdRef = useRef(0);

  const resetUsernameAvailability = useCallback(() => {
    usernameCheckIdRef.current += 1;
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
  }, []);

  const markUsernameAvailable = useCallback(() => {
    usernameCheckIdRef.current += 1;
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
  }, []);

  const markUsernameUnavailable = useCallback(() => {
    usernameCheckIdRef.current += 1;
    setUsernameAvailable(false);
    setUsernameSuggestions([]);
  }, []);

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3 || !validateUsername(usernameToCheck).isValid) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    const checkId = ++usernameCheckIdRef.current;
    setIsCheckingUsername(true);
    try {
      const result = await checkUsernameAvailability(usernameToCheck, currentUserId);
      if (checkId !== usernameCheckIdRef.current) return;
      setUsernameAvailable(result.isAvailable);
      setUsernameSuggestions(result.suggestions || []);
    } catch {
      if (checkId !== usernameCheckIdRef.current) return;
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    } finally {
      if (checkId === usernameCheckIdRef.current) setIsCheckingUsername(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);

    if (username.trim().length >= 3) {
      usernameCheckTimeoutRef.current = setTimeout(() => checkUsername(username.trim()), 500);
    } else {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    }

    return () => {
      if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);
    };
  }, [username, checkUsername]);

  return {
    isCheckingUsername,
    markUsernameAvailable,
    markUsernameUnavailable,
    resetUsernameAvailability,
    usernameAvailable,
    usernameSuggestions,
  };
};
