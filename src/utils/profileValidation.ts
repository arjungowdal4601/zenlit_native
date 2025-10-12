import { supabase } from '../lib/supabase';

export interface ProfileData {
  display_name: string;
  user_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UsernameCheckResult {
  isAvailable: boolean;
  suggestions?: string[];
}

/**
 * Validates username format - only lowercase letters, numbers, dots, underscores, and special characters
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' };
  }

  // Check if username contains only allowed characters (lowercase letters, numbers, dots, underscores, special chars)
  const validUsernameRegex = /^[a-z0-9._!@#$%^&*()+=\-\[\]{}|;:,<>?/~`]+$/;
  
  if (!validUsernameRegex.test(username)) {
    return { 
      isValid: false, 
      error: 'Username can only contain lowercase letters, numbers, dots, underscores, and special characters' 
    };
  }

  return { isValid: true };
};

/**
 * Validates display name
 */
export const validateDisplayName = (displayName: string): ValidationResult => {
  if (!displayName) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (displayName.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters long' };
  }

  if (displayName.length > 50) {
    return { isValid: false, error: 'Display name must be less than 50 characters' };
  }

  return { isValid: true };
};

/**
 * Validates date of birth
 */
export const validateDateOfBirth = (dateOfBirth: string): ValidationResult => {
  if (!dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  const date = new Date(dateOfBirth);
  const today = new Date();
  const minAge = new Date();
  minAge.setFullYear(today.getFullYear() - 13);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  if (date > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  if (date > minAge) {
    return { isValid: false, error: 'You must be at least 13 years old' };
  }

  return { isValid: true };
};

/**
 * Checks if username is available and provides suggestions if not
 */
export const checkUsernameAvailability = async (username: string): Promise<UsernameCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_name')
      .eq('user_name', username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      // No rows found, username is available
      return { isAvailable: true };
    }

    // Username is taken, generate suggestions
    const suggestions = await generateUsernameSuggestions(username);
    return { isAvailable: false, suggestions };
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw new Error('Failed to check username availability');
  }
};

/**
 * Generates username suggestions when the desired username is taken
 */
export const generateUsernameSuggestions = async (baseUsername: string): Promise<string[]> => {
  const suggestions: string[] = [];
  const maxSuggestions = 5;
  const maxAttempts = 15;

  // Generate different types of suggestions
  const suggestionTypes = [
    () => `${baseUsername}${Math.floor(Math.random() * 999) + 1}`,
    () => `${baseUsername}_${Math.floor(Math.random() * 99) + 1}`,
    () => `${baseUsername}.${Math.floor(Math.random() * 99) + 1}`,
    () => `${baseUsername}${new Date().getFullYear()}`,
    () => `${baseUsername}_user`,
    () => `${baseUsername}${Math.floor(Math.random() * 9999) + 100}`,
  ];

  for (let i = 0; i < maxAttempts && suggestions.length < maxSuggestions; i++) {
    const suggestion = suggestionTypes[i % suggestionTypes.length]();

    if (suggestions.includes(suggestion)) {
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('user_name', suggestion)
        .maybeSingle();

      if (error) {
        continue;
      }

      if (!data) {
        suggestions.push(suggestion);
      }
    } catch (error) {
      continue;
    }
  }

  return suggestions;
};

/**
 * Validates all profile data
 */
export const validateProfileData = (profileData: ProfileData): ValidationResult => {
  const displayNameValidation = validateDisplayName(profileData.display_name);
  if (!displayNameValidation.isValid) {
    return displayNameValidation;
  }

  const usernameValidation = validateUsername(profileData.user_name);
  if (!usernameValidation.isValid) {
    return usernameValidation;
  }

  const dobValidation = validateDateOfBirth(profileData.date_of_birth);
  if (!dobValidation.isValid) {
    return dobValidation;
  }

  if (!profileData.gender) {
    return { isValid: false, error: 'Gender is required' };
  }

  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(profileData.gender)) {
    return { isValid: false, error: 'Invalid gender value' };
  }

  return { isValid: true };
};