import React from 'react';
import { act, render } from '../utils/render';
import { VisibilityProvider } from '../../src/contexts/VisibilityContext';
import { deleteUserLocation, updateUserLocation } from '../../src/services/locationDbService';

jest.mock('../../src/services/locationDbService', () => ({
  updateUserLocation: jest.fn(async () => ({ success: true, error: null })),
  deleteUserLocation: jest.fn(async () => ({ success: true, error: null })),
}));

jest.mock('../../src/services/locationService', () => ({
  requestLocationPermission: jest.fn(async () => 'granted'),
  getCurrentLocation: jest.fn(async () => ({ latitude: 12.9716, longitude: 77.5946 })),
  watchLocation: jest.fn(() => jest.fn()),
}));

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('VisibilityProvider gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not write or clear location while disabled', async () => {
    render(
      <VisibilityProvider enabled={false}>
        <></>
      </VisibilityProvider>,
    );

    await flushEffects();

    expect(updateUserLocation).not.toHaveBeenCalled();
    expect(deleteUserLocation).not.toHaveBeenCalled();
  });

  it('keeps existing disabled visibility cleanup while enabled', async () => {
    render(
      <VisibilityProvider>
        <></>
      </VisibilityProvider>,
    );

    await flushEffects();

    expect(deleteUserLocation).toHaveBeenCalledTimes(1);
  });
});
