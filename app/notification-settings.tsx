import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../src/styles/theme';
import { logger } from '../src/utils/logger';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationPreferences,
} from '../src/services/notificationService';

const NotificationSettingsScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages: true,
    muted_conversations: [],
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { settings, error } = await getNotificationSettings();

      if (error) {
        logger.error('NotificationSettings', 'Error loading settings:', error);
      } else if (settings) {
        setNotificationsEnabled(settings.enabled);
        setPreferences(settings.preferences);
      }

      setLoading(false);
    } catch (error) {
      logger.error('NotificationSettings', 'Exception loading settings:', error);
      setLoading(false);
    }
  }

  async function saveSettings(
    enabled?: boolean,
    prefs?: Partial<NotificationPreferences>
  ) {
    setSaving(true);

    try {
      const nextPrefs = prefs ? { ...preferences, ...prefs } : undefined;
      if (prefs) {
        setPreferences(nextPrefs as NotificationPreferences);
      }

      const { settings, error } = await updateNotificationSettings({
        enabled,
        preferences: nextPrefs,
      });

      if (error) {
        logger.error('NotificationSettings', 'Error saving settings:', error);
      } else {
        if (settings) {
          setNotificationsEnabled(settings.enabled);
          setPreferences(settings.preferences);
        }
        logger.info('NotificationSettings', 'Settings saved successfully');
      }

      setSaving(false);
    } catch (error) {
      logger.error('NotificationSettings', 'Exception saving settings:', error);
      setSaving(false);
    }
  }

  function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
    saveSettings(value);
  }

  function handleTogglePreference(key: keyof NotificationPreferences, value: boolean) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    saveSettings(undefined, { [key]: value });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Paused for Web</Text>
          <Text style={styles.warningText}>
            Push delivery is disabled while Zenlit is focused on the web app.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Master Control</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Turn all notifications on or off
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#334155', true: '#60a5fa' }}
              thumbColor="#ffffff"
              disabled={saving}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages</Text>
              <Text style={styles.settingDescription}>
                New message notifications from other users
              </Text>
            </View>
            <Switch
              value={preferences.messages}
              onValueChange={(value) => handleTogglePreference('messages', value)}
              trackColor={{ false: '#334155', true: '#60a5fa' }}
              thumbColor="#ffffff"
              disabled={saving || !notificationsEnabled}
            />
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Messaging Only</Text>
            <Text style={styles.infoText}>
              Push notifications are currently limited to direct messages. Other notification
              types have been removed.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 6,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;
