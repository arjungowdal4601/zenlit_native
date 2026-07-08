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

  const setUsernameAvailability = useCallback((value: boolean | null) => {
    usernameCheckIdRef.current += 1;
    setIsCheckingUsername(false);
    setUsernameAvailable(value);
    setUsernameSuggestions([]);
  }, []);

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3 || !validateUsername(usernameToCheck).isValid) {
      setUsernameAvailability(null);
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
  }, [currentUserId, setUsernameAvailability]);

  useEffect(() => {
    if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);

    if (username.trim().length >= 3) {
      usernameCheckTimeoutRef.current = setTimeout(() => checkUsername(username.trim()), 500);
    } else {
      setUsernameAvailability(null);
    }

    return () => {
      if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);
    };
  }, [username, checkUsername, setUsernameAvailability]);

  return {
    isCheckingUsername,
    setUsernameAvailability,
    usernameAvailable,
    usernameSuggestions,
  };
};
