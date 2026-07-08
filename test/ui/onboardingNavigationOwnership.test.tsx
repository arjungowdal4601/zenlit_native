import React from 'react';

import { act, fireEvent, render, screen, waitFor } from '../utils/render';
import type { OnboardingState } from '../../src/utils/onboardingState';

const mockReplace = jest.fn();
const mockResolveOnboardingState = jest.fn();
const mockSaveProfileBasicsDraft = jest.fn();
const mockSaveRequiredProfileBasics = jest.fn();
const mockSaveOptionalProfileDetails = jest.fn();
const mockSkipOptionalProfileDetails = jest.fn();
const mockCheckUsernameAvailability = jest.fn();
const mockUploadProfileImagesWithCleanup = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../src/services/onboardingService', () => ({
  resolveOnboardingState: (...args: unknown[]) => mockResolveOnboardingState(...args),
  saveProfileBasicsDraft: (...args: unknown[]) => mockSaveProfileBasicsDraft(...args),
  saveRequiredProfileBasics: (...args: unknown[]) => mockSaveRequiredProfileBasics(...args),
  saveOptionalProfileDetails: (...args: unknown[]) => mockSaveOptionalProfileDetails(...args),
  skipOptionalProfileDetails: (...args: unknown[]) => mockSkipOptionalProfileDetails(...args),
}));

jest.mock('../../src/services/profileService', () => ({
  checkUsernameAvailability: (...args: unknown[]) => mockCheckUsernameAvailability(...args),
}));

jest.mock('../../src/utils/profileImageUploads', () => ({
  uploadProfileImagesWithCleanup: (...args: unknown[]) => mockUploadProfileImagesWithCleanup(...args),
}));

import OnboardingBasicScreen from '../../app/onboarding/profile/basic';
import CompleteProfileScreen from '../../app/onboarding/profile/complete';

const basicsRequiredState: OnboardingState = {
  status: 'profile-basics-required',
  userId: 'user-1',
  prefill: {
    display_name: 'Alex Johnson',
    user_name: 'alex',
    date_of_birth: '1998-04-12',
    gender: 'other',
  },
  missingFields: [],
};

const optionalPendingState: OnboardingState = {
  ...basicsRequiredState,
  status: 'optional-profile-details',
};

const onboardedState: OnboardingState = {
  ...basicsRequiredState,
  status: 'fully-onboarded',
};

const renderCompleteProfile = () => render(<CompleteProfileScreen />);

describe('onboarding navigation ownership', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
    mockResolveOnboardingState.mockReset();
    mockSaveProfileBasicsDraft.mockReset();
    mockSaveRequiredProfileBasics.mockReset();
    mockSaveOptionalProfileDetails.mockReset();
    mockSkipOptionalProfileDetails.mockReset();
    mockCheckUsernameAvailability.mockReset();
    mockUploadProfileImagesWithCleanup.mockReset();
    mockSaveProfileBasicsDraft.mockResolvedValue({ data: {}, error: null });
    mockCheckUsernameAvailability.mockResolvedValue({ isAvailable: true, suggestions: [] });
    mockUploadProfileImagesWithCleanup.mockResolvedValue({
      avatarUrl: null,
      bannerUrl: null,
      cleanupUploadedImages: jest.fn(async () => undefined),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not route away when Profile Basics mounts with a different onboarding state', async () => {
    mockResolveOnboardingState.mockResolvedValueOnce(optionalPendingState);

    render(<OnboardingBasicScreen />);

    await waitFor(() => expect(screen.getByText('Set up your presence')).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('saves Profile Basics and routes to Complete Profile from the returned state', async () => {
    mockResolveOnboardingState.mockResolvedValueOnce(basicsRequiredState);
    mockSaveRequiredProfileBasics.mockResolvedValueOnce({ data: optionalPendingState, error: null });

    render(<OnboardingBasicScreen />);

    await waitFor(() => expect(screen.getByText('Set up your presence')).toBeTruthy());
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByText('Username is available!')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
      await Promise.resolve();
    });

    expect(mockSaveRequiredProfileBasics).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/onboarding/profile/complete');
  });

  it('skips Complete Profile and routes to the app from the returned state', async () => {
    mockSkipOptionalProfileDetails.mockResolvedValueOnce({ data: onboardedState, error: null });

    renderCompleteProfile();

    await waitFor(() => expect(screen.getByText('Complete your profile')).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Skip optional details' }));
      await Promise.resolve();
    });

    expect(mockSkipOptionalProfileDetails).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/radar');
  });

  it('keeps Complete Profile social URL cleanup local to the form', () => {
    renderCompleteProfile();

    fireEvent.press(screen.getByLabelText('Edit Instagram username'));
    fireEvent.changeText(screen.getByPlaceholderText('username'), 'https://instagram.com/alex/');

    expect(screen.getByText('Will link to: instagram.com/alex')).toBeTruthy();
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('alex')).toBeTruthy();
  });
});
