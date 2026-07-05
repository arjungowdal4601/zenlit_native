import React from 'react';
import { render, screen } from '../utils/render';
import type { LocationStatus } from '../../src/contexts/VisibilityContext';

type MockVisibilityState = {
  selectedAccounts: never[];
  isVisible: boolean;
  locationPermissionDenied: boolean;
  locationStatus: LocationStatus;
  requestLocationPermission: jest.Mock;
  setIsVisible: jest.Mock;
};

let mockVisibilityState: MockVisibilityState;

jest.mock('../../src/contexts/VisibilityContext', () => ({
  useVisibility: () => mockVisibilityState,
}));

jest.mock('../../src/services/locationDbService', () => ({
  getNearbyUsers: jest.fn(async () => ({ users: [], error: null })),
}));

jest.mock('../../src/components/AppHeader', () => ({
  AppHeader: ({ title }: { title: string }) => <>{title}</>,
}));

jest.mock('../../src/components/SocialProfileCard', () => ({
  SocialProfileCard: () => null,
}));

jest.mock('../../src/components/VisibilitySheet', () => () => null);

import RadarScreen from '../../app/radar';

const renderRadarScreen = () => {
  const timeoutSpy = jest
    .spyOn(global, 'setTimeout')
    .mockImplementation(() => 0 as unknown as ReturnType<typeof setTimeout>);

  const result = render(<RadarScreen />);
  timeoutSpy.mockRestore();
  return result;
};

const makeVisibilityState = (
  overrides: Partial<MockVisibilityState> = {},
): MockVisibilityState => ({
  selectedAccounts: [],
  isVisible: false,
  locationPermissionDenied: false,
  locationStatus: 'not-attempted',
  requestLocationPermission: jest.fn(async () => true),
  setIsVisible: jest.fn(),
  ...overrides,
});

describe('Radar gate states', () => {
  it('asks for location only inside Radar with in-context copy', () => {
    mockVisibilityState = makeVisibilityState();

    renderRadarScreen();

    expect(screen.getByText('Share your location to start Radar.')).toBeTruthy();
    expect(
      screen.getByText('Your browser will ask for permission. Zenlit uses your location to show nearby people, and you can turn visibility off anytime.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enable location' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeTruthy();
  });

  it('keeps denied location as a Radar-only retry state', () => {
    mockVisibilityState = makeVisibilityState({
      locationPermissionDenied: true,
      locationStatus: 'permission-denied',
    });

    renderRadarScreen();

    expect(screen.getByText('Location permission is off')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry location' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
  });

  it('keeps visibility-off separate from onboarding completion', () => {
    mockVisibilityState = makeVisibilityState({
      locationStatus: 'success',
    });

    renderRadarScreen();

    expect(screen.getByText('Radar visibility is off')).toBeTruthy();
    expect(screen.getByText('Turn it on to appear on Radar and see nearby users.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Turn on visibility' })).toBeTruthy();
  });
});
