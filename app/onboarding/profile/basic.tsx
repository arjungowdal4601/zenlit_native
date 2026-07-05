import React from 'react';

import {
  ProfileBasicsForm,
  ProfileBasicsLoading,
} from '../../../src/components/onboarding/ProfileBasicsForm';
import { useProfileBasicsOnboarding } from '../../../src/hooks/useProfileBasicsOnboarding';

const OnboardingBasicScreen: React.FC = () => {
  const form = useProfileBasicsOnboarding();
  return form.isLoadingProfile ? <ProfileBasicsLoading /> : <ProfileBasicsForm {...form} />;
};

export default OnboardingBasicScreen;
