/**
 * Notifications Screen - Phase 4
 * Manage push notification settings and preferences
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PushNotificationService } from '../../services/pushNotifications';
import type { NotificationPreferences } from '../../services/pushNotifications';

export function NotificationsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [testNotificationSending, setTestNotificationSending] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const preferences = await PushNotificationService.getPreferences();
      setPrefs(preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    try {
      if (!prefs) return;

      const updated = { ...prefs, [key]: value };
      setPrefs(updated);

      await PushNotificationService.setPreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preference');
      // Revert change
      loadPreferences();
    }
  };

  const sendTestNotification = async () => {
    try {
      setTestNotificationSending(true);
      await PushNotificationService.sendNotification({
        title: '🧪 Test Notification',
        body: 'This is a test notification from Money Manager',
        priority: 'high',
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setTestNotificationSending(false);
    }
  };

  const sendTransactionTest = async () => {
    try {
      setTestNotificationSending(true);
      await PushNotificationService.sendTransactionAlert(500, 'Amazon', 'debit');
      Alert.alert('Success', 'Transaction test notification sent!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setTestNotificationSending(false);
    }
  };

  const sendBudgetTest = async () => {
    try {
      setTestNotificationSending(true);
      await PushNotificationService.sendBudgetWarning('Food & Dining', 450, 500, 90);
      Alert.alert('Success', 'Budget warning test sent!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setTestNotificationSending(false);
    }
  };

  if (loading || !prefs) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Push Notifications</Text>
        <Text style={styles.sectionDescription}>
          Manage how you receive alerts and reminders
        </Text>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.groupTitle}>Notification Types</Text>

        <PreferenceRow
          icon="💳"
          title="Transaction Alerts"
          description="Get notified when transactions are synced"
          value={prefs.transactionAlerts}
          onToggle={(value) => updatePreference('transactionAlerts', value)}
        />

        <PreferenceRow
          icon="⚠️"
          title="Low Balance Alerts"
          description="Alert when account balance is low"
          value={prefs.lowBalanceAlerts}
          onToggle={(value) => updatePreference('lowBalanceAlerts', value)}
        />

        <PreferenceRow
          icon="📊"
          title="Budget Warnings"
          description="Alert when spending exceeds budget"
          value={prefs.budgetAlerts}
          onToggle={(value) => updatePreference('budgetAlerts', value)}
        />

        <PreferenceRow
          icon="🔔"
          title="Recurring Reminders"
          description="Remind about recurring transactions"
          value={prefs.recurringReminders}
          onToggle={(value) => updatePreference('recurringReminders', value)}
        />

        <PreferenceRow
          icon="📢"
          title="System Messages"
          description="Important updates and announcements"
          value={prefs.systemMessages}
          onToggle={(value) => updatePreference('systemMessages', value)}
        />
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.groupTitle}>🔇 Quiet Hours</Text>

        <PreferenceRow
          icon="🌙"
          title="Enable Quiet Hours"
          description="Disable notifications during specific times"
          value={prefs.quietHoursEnabled}
          onToggle={(value) => updatePreference('quietHoursEnabled', value)}
        />

        {prefs.quietHoursEnabled && (
          <>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>From:</Text>
              <Text style={styles.timeValue}>{prefs.quietHoursStart}</Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>To:</Text>
              <Text style={styles.timeValue}>{prefs.quietHoursEnd}</Text>
            </View>
          </>
        )}
      </View>

      {/* Test Notifications */}
      <View style={styles.section}>
        <Text style={styles.groupTitle}>🧪 Test Notifications</Text>

        <TestButton
          title="Test Basic Notification"
          onPress={sendTestNotification}
          loading={testNotificationSending}
        />

        <TestButton
          title="Test Transaction Alert"
          onPress={sendTransactionTest}
          loading={testNotificationSending}
        />

        <TestButton
          title="Test Budget Warning"
          onPress={sendBudgetTest}
          loading={testNotificationSending}
        />
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          Push notifications require:"On" permissions in device settings. Make sure Money Manager has notification permission enabled.
        </Text>
      </View>
    </ScrollView>
  );
}

interface PreferenceRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function PreferenceRow({ icon, title, description, value, onToggle }: PreferenceRowProps) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>{icon} {title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#81C784' }}
        thumbColor={value ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );
}

interface TestButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

function TestButton({ title, onPress, loading }: TestButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.testButton, loading && styles.testButtonDisabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.testButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceContent: {
    flex: 1,
    marginRight: 12,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
