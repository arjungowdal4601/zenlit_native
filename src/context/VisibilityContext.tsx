import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type SocialAccount = {
  id: string;
  label: string;
};

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X (Twitter)' },
];

type VisibilityContextValue = {
  isVisible: boolean;
  selectedAccounts: string[];
  toggleVisibility: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleAccount: (id: string) => void;
};

const VisibilityContext = createContext<VisibilityContextValue | undefined>(undefined);

type VisibilityProviderProps = {
  children: ReactNode;
};

export const VisibilityProvider: React.FC<VisibilityProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    SOCIAL_ACCOUNTS.map((account) => account.id)
  );

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  const selectAll = () => {
    setSelectedAccounts(SOCIAL_ACCOUNTS.map((account) => account.id));
  };

  const deselectAll = () => {
    setSelectedAccounts([]);
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((accountId) => accountId !== id) : [...prev, id]
    );
  };

  const value = useMemo(
    () => ({ isVisible, selectedAccounts, toggleVisibility, selectAll, deselectAll, toggleAccount }),
    [isVisible, selectedAccounts]
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
};

export const useVisibility = (): VisibilityContextValue => {
  const context = useContext(VisibilityContext);

  if (!context) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }

  return context;
};
