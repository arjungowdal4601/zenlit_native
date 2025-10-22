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

const getErrorCode = (error: any): number => {
  if (Platform.OS === 'web') {
    return error.code || 0;
  }
  return 1;
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
          reject({
            code: getErrorCode(error),
            message: error.message || 'Failed to get location',
          });
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
            distanceInterval: 100,
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
          onError({
            code: getErrorCode(error),
            message: error.message || 'Failed to watch location',
          });
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
