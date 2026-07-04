import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { isAuthReady } from '../services/authService';
import {
  removePushToken,
  savePushToken,
  updateNotificationSettings,
  type NotificationPreferences,
} from '../services/notificationService';
import { logger } from '../utils/logger';

export type { NotificationPreferences } from '../services/notificationService';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isAuthReady()) {
      return;
    }

    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      logger.info('Notifications', 'Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      logger.info('Notifications', 'Notification tapped:', response);
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token: string | null = null;

    if (Platform.OS === 'web') {
      logger.info('Notifications', 'Push notifications not available on web');
      return;
    }

    if (!Device.isDevice) {
      logger.warn('Notifications', 'Must use physical device for push notifications');
      setPermissionStatus('denied');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Notifications', 'Permission not granted');
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '0a650645-9cc0-410e-a147-f5409c7c8432',
      });
      token = tokenData.data;

      logger.info('Notifications', 'Got push token:', token);
      setExpoPushToken(token);

      await saveTokenToDatabase(token);

    } catch (error) {
      logger.error('Notifications', 'Error registering for push notifications:', error);
      setPermissionStatus('denied');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#60a5fa',
      });
    }

    return token;
  }

  async function saveTokenToDatabase(token: string) {
    try {
      const { error } = await savePushToken(token);

      if (error) {
        logger.error('Notifications', 'Error saving token to database:', error);
      } else {
        logger.info('Notifications', 'Token saved to database successfully');
      }
    } catch (error) {
      logger.error('Notifications', 'Exception saving token:', error);
    }
  }

  async function unregisterToken() {
    try {
      const { error } = await removePushToken();

      if (error) {
        logger.error('Notifications', 'Error removing token from database:', error);
      } else {
        logger.info('Notifications', 'Token removed from database');
        setExpoPushToken(null);
      }
    } catch (error) {
      logger.error('Notifications', 'Exception removing token:', error);
    }
  }

  async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
    try {
      const { error } = await updateNotificationSettings({ preferences });

      if (error) {
        logger.error('Notifications', 'Error updating preferences:', error);
        return { error: error.message };
      }

      logger.info('Notifications', 'Preferences updated successfully');
      return { error: null };
    } catch (error) {
      logger.error('Notifications', 'Exception updating preferences:', error);
      return { error: 'Failed to update preferences' };
    }
  }

  async function toggleNotifications(enabled: boolean) {
    try {
      const { error } = await updateNotificationSettings({ enabled });

      if (error) {
        logger.error('Notifications', 'Error toggling notifications:', error);
        return { error: error.message };
      }

      logger.info('Notifications', `Notifications ${enabled ? 'enabled' : 'disabled'}`);
      return { error: null };
    } catch (error) {
      logger.error('Notifications', 'Exception toggling notifications:', error);
      return { error: 'Failed to toggle notifications' };
    }
  }

  function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    logger.info('Notifications', 'Handling notification response with data:', data);

    // Routing is handled in the root layout; keep this stub for future deep link handling.
  }

  return {
    expoPushToken,
    notification,
    permissionStatus,
    registerForPushNotifications: registerForPushNotificationsAsync,
    unregisterToken,
    updateNotificationPreferences,
    toggleNotifications,
  };
}
