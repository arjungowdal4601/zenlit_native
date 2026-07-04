import React from 'react';
import { act, fireEvent, render, screen } from '../utils/render';

const mockReplace = jest.fn();
const mockPersistHasSeenGetStarted = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('../../src/utils/getStartedPreference', () => ({
  persistHasSeenGetStarted: () => mockPersistHasSeenGetStarted(),
}));

import GetStartedScreen from '../../app/index';

describe('Get Started screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
    mockPersistHasSeenGetStarted.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows the minimal Zenlit entry copy and CTA', () => {
    render(<GetStartedScreen />);

    expect(screen.getByText('Zenlit')).toBeTruthy();
    expect(screen.getByText('Connect with people around you.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy();
  });

  it('persists the entry state and routes to auth when CTA is pressed', () => {
    render(<GetStartedScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Get Started' }));

    expect(mockPersistHasSeenGetStarted).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });
});
