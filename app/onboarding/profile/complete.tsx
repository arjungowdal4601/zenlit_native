import React from 'react';

import { CompleteProfileForm } from '../../../src/components/onboarding/CompleteProfileForm';
import { useCompleteProfileOnboarding } from '../../../src/hooks/useCompleteProfileOnboarding';

const CompleteProfileScreen: React.FC = () => {
  const profile = useCompleteProfileOnboarding();
  return <CompleteProfileForm profile={profile} />;
};

export default CompleteProfileScreen;
