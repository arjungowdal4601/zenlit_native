import { render, screen } from '../utils/render';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../src/services/authService', () => ({
  signOut: jest.fn(async () => ({ error: null })),
}));

jest.mock('../../src/services/onboardingService', () => ({
  resolveOnboardingState: jest.fn(),
}));

import OnboardingRecoveryScreen from '../../app/onboarding/recovery';

describe('Onboarding recovery screen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('uses generic setup recovery copy', () => {
    render(<OnboardingRecoveryScreen />);

    expect(screen.getByText('We could not confirm your setup')).toBeTruthy();
    expect(screen.getByText('Continue to check your account and fix anything missing, or sign out and try again.')).toBeTruthy();
    expect(screen.queryByText(/unfinished setup/i)).toBeNull();
  });
});
