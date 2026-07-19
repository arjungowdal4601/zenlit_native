import type { OnboardingState } from './onboardingState';

type OnboardingStateListener = (state: OnboardingState) => void;

const listeners = new Set<OnboardingStateListener>();

export const publishOnboardingState = (state: OnboardingState) => {
  if (listeners.size === 0) return false;
  listeners.forEach((listener) => listener(state));
  return true;
};

export const subscribeToOnboardingState = (listener: OnboardingStateListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
