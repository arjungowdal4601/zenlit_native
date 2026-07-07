import { act, fireEvent, render, screen } from '../utils/render';

const mockRefreshPublishedOnboardingState = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../src/services/authService', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock('../../src/services/onboardingService', () => ({
  refreshPublishedOnboardingState: (...args: unknown[]) => mockRefreshPublishedOnboardingState(...args),
}));

import OnboardingRecoveryScreen from '../../app/onboarding/recovery';

describe('Onboarding recovery screen', () => {
  beforeEach(() => {
    mockRefreshPublishedOnboardingState.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('uses generic setup recovery copy', () => {
    render(<OnboardingRecoveryScreen />);

    expect(screen.getByText('We could not confirm your setup')).toBeTruthy();
    expect(screen.getByText('Continue to check your account and fix anything missing, or sign out and try again.')).toBeTruthy();
    expect(screen.queryByText(/unfinished setup/i)).toBeNull();
  });

  it('continues by refreshing and publishing onboarding state for the root gate', async () => {
    mockRefreshPublishedOnboardingState.mockResolvedValueOnce({
      status: 'fully-onboarded',
      userId: 'user-1',
      prefill: {
        display_name: 'Alex',
        user_name: 'alex',
        date_of_birth: '1998-04-12',
        gender: 'other',
      },
      missingFields: [],
    });

    render(<OnboardingRecoveryScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Continue setup' }));
      await Promise.resolve();
    });

    expect(mockRefreshPublishedOnboardingState).toHaveBeenCalledTimes(1);
  });

  it('stays on recovery and shows a retry message while state is still recovery', async () => {
    mockRefreshPublishedOnboardingState.mockResolvedValueOnce({
      status: 'recovery',
      userId: 'user-1',
      prefill: {
        display_name: null,
        user_name: 'alex',
        date_of_birth: '1998-04-12',
        gender: 'other',
      },
      missingFields: ['display_name'],
      reason: 'backend-read-failed',
    });

    render(<OnboardingRecoveryScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Continue setup' }));
      await Promise.resolve();
    });

    expect(mockRefreshPublishedOnboardingState).toHaveBeenCalledTimes(1);
    expect(screen.getByText('We still could not confirm your setup. Please try again or sign out.')).toBeTruthy();
  });

  it('signs out globally and lets the root gate return to Auth', async () => {
    render(<OnboardingRecoveryScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
      await Promise.resolve();
    });

    expect(mockSignOut).toHaveBeenCalledWith('global');
  });
});
