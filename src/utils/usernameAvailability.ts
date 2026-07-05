export type UsernameAvailabilityInput = {
  requestedUsername: string;
  currentUserId?: string | null;
  ownerId?: string | null;
  suggestions?: string[];
};

export type UsernameAvailabilityResult = {
  isAvailable: boolean;
  suggestions: string[];
};

export const evaluateUsernameAvailability = ({
  requestedUsername,
  currentUserId,
  ownerId,
  suggestions = [],
}: UsernameAvailabilityInput): UsernameAvailabilityResult => {
  if (!ownerId || ownerId === currentUserId) {
    return { isAvailable: true, suggestions: [] };
  }

  const normalizedRequested = requestedUsername.trim().toLowerCase();
  const filteredSuggestions = suggestions.filter(
    (suggestion) => suggestion.trim().toLowerCase() !== normalizedRequested,
  );

  return {
    isAvailable: false,
    suggestions: filteredSuggestions,
  };
};
