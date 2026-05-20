import { Platform } from 'react-native';
import * as Location from 'expo-location';

const GEO_OPTS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 60000,
};

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type LocationError = {
  code: number;
  message: string;
};

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) {
      return message;
    }
  }

  return fallback;
};

const getRawErrorCode = (error: unknown): unknown => {
  if (typeof error === 'object' && error && 'code' in error) {
    return (error as { code?: unknown }).code;
  }

  return undefined;
};

export const normalizeLocationError = (
  error: unknown,
  platform: typeof Platform.OS = Platform.OS,
): LocationError => {
  const message = getErrorMessage(error, 'Failed to get location');
  const rawCode = getRawErrorCode(error);

  if (platform === 'web') {
    return {
      code: typeof rawCode === 'number' ? rawCode : 0,
      message,
    };
  }

  const normalizedCode = String(rawCode ?? '').toLowerCase();
  const normalizedMessage = message.toLowerCase();
  const combined = `${normalizedCode} ${normalizedMessage}`;

  if (
    combined.includes('permission') ||
    combined.includes('denied') ||
    combined.includes('unauthorized')
  ) {
    return { code: 1, message };
  }

  if (
    combined.includes('unavailable') ||
    combined.includes('provider') ||
    combined.includes('disabled') ||
    combined.includes('services')
  ) {
    return { code: 2, message };
  }

  if (combined.includes('timeout') || combined.includes('timed out')) {
    return { code: 3, message };
  }

  return { code: 0, message };
};

export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  if (Platform.OS === 'web') {
    if (!('geolocation' in navigator)) {
      return 'denied';
    }
    return 'undetermined';
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      return 'granted';
    }
    return 'denied';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return 'denied';
  }
};

export const checkLocationPermission = async (): Promise<LocationPermissionStatus> => {
  if (Platform.OS === 'web') {
    if (!('geolocation' in navigator)) {
      return 'denied';
    }
    return 'undetermined';
  }

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    }
    return 'undetermined';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'denied';
  }
};

export const getCurrentLocation = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) {
        reject({ code: 1, message: 'Geolocation not available' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject({
            code: error.code,
            message: error.message,
          });
        },
        GEO_OPTS
      );
    } else {
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,
        distanceInterval: 0,
      })
        .then((location) => {
          resolve({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        })
        .catch((error) => {
          reject(normalizeLocationError(error));
        });
    }
  });
};

export const watchLocation = (
  onSuccess: (coords: LocationCoords) => void,
  onError: (error: LocationError) => void,
  interval: number = 60000
): (() => void) => {
  if (Platform.OS === 'web') {
    if (!('geolocation' in navigator)) {
      onError({ code: 1, message: 'Geolocation not available' });
      return () => {};
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startWatching = () => {
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onSuccess({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            onError({
              code: error.code,
              message: error.message,
            });
          },
          GEO_OPTS
        );
      }, interval);
    };

    startWatching();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  } else {
    let subscription: Location.LocationSubscription | null = null;
    let isActive = true;

    const startWatching = async () => {
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: interval,
            distanceInterval: 0,
          },
          (location) => {
            if (isActive) {
              onSuccess({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        );
      } catch (error: any) {
        if (isActive) {
          onError(normalizeLocationError(error));
        }
      }
    };

    startWatching();

    return () => {
      isActive = false;
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
    };
  }
};
