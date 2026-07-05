import React from 'react';
import { Stack } from 'expo-router';

import { OnboardingProfileDraftProvider } from '../../src/contexts/OnboardingProfileDraftContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProfileDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProfileDraftProvider>
  );
}
