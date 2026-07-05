import React from 'react';

import {
  ProfileBasicsForm,
  ProfileBasicsLoading,
} from './ProfileBasicsForm';
import { useProfileBasicsOnboarding } from './useProfileBasicsOnboarding';

const OnboardingBasicScreen: React.FC = () => {
  const form = useProfileBasicsOnboarding();
  return form.isLoadingProfile ? <ProfileBasicsLoading /> : <ProfileBasicsForm {...form} />;
};

export default OnboardingBasicScreen;
