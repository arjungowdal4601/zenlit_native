import React from 'react';

import {
  CompleteProfileForm,
  CompleteProfileLoading,
} from '../../../src/components/onboarding/CompleteProfileForm';
import { useCompleteProfileOnboarding } from '../../../src/hooks/useCompleteProfileOnboarding';

const CompleteProfileScreen: React.FC = () => {
  const profile = useCompleteProfileOnboarding();
  return profile.isCheckingSetup ? <CompleteProfileLoading /> : <CompleteProfileForm profile={profile} />;
};

export default CompleteProfileScreen;
