import { normalizeLocationError } from '../../src/services/locationService';

describe('location error normalization', () => {
  it('preserves browser geolocation codes', () => {
    expect(normalizeLocationError({ code: 3, message: 'Timed out' }, 'web')).toEqual({
      code: 3,
      message: 'Timed out',
    });
  });

  it('maps native timeout errors to the timeout code', () => {
    expect(normalizeLocationError(new Error('Location request timed out'), 'ios')).toEqual({
      code: 3,
      message: 'Location request timed out',
    });
  });

  it('maps native unavailable/provider errors to the unavailable code', () => {
    expect(normalizeLocationError(new Error('Location provider is unavailable'), 'android')).toEqual({
      code: 2,
      message: 'Location provider is unavailable',
    });
  });

  it('maps native permission errors to the permission denied code', () => {
    expect(normalizeLocationError(new Error('Foreground location permission denied'), 'ios')).toEqual({
      code: 1,
      message: 'Foreground location permission denied',
    });
  });

  it('keeps unknown native failures distinct from permission denial', () => {
    expect(normalizeLocationError(new Error('Unexpected native failure'), 'android')).toEqual({
      code: 0,
      message: 'Unexpected native failure',
    });
  });
});
