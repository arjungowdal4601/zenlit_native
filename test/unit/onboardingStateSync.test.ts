import type { OnboardingState } from '../../src/utils/onboardingState';
import {
  publishOnboardingState,
  subscribeToOnboardingState,
} from '../../src/utils/onboardingStateSync';

const state: OnboardingState = {
  status: 'fully-onboarded',
  userId: 'user-1',
  prefill: {
    display_name: 'Arjun QA',
    user_name: 'arjun_qa',
    date_of_birth: '1998-01-15',
    gender: 'male',
  },
  missingFields: [],
};

describe('onboarding state synchronization', () => {
  it('lets the root gate own navigation when it is subscribed', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToOnboardingState(listener);

    expect(publishOnboardingState(state)).toBe(true);
    expect(listener).toHaveBeenCalledWith(state);

    unsubscribe();
    expect(publishOnboardingState(state)).toBe(false);
  });
});
