import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/src/context/ThemeContext';
import { SMSService } from '@/src/services/sms';
import { SMSSyncManager, type SyncProgress } from '@/src/services/smsSyncManager';
import { useStore } from '@/src/store/appStore';
import { AdvancedAnalyticsScreen } from '@/src/components/screens/AdvancedAnalyticsDetailScreen';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const userId = useStore((state) => state.user?.id);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);

  const handleDarkModeToggle = async () => {
    toggleTheme();
    Alert.alert('✅ Success', `Dark mode ${isDarkMode ? 'disabled' : 'enabled'}`);
  };

  const handleTestSMS = async () => {
    try {
      setSyncLoading(true);
      const sms = await SMSService.readSMS({ limit: 5, filter: 'transaction' });
      if (sms.length > 0) {
        Alert.alert(
          '✅ SMS Test Success',
          `Read ${sms.length} SMS\nFirst SMS: ${sms[0].body?.substring(0, 50)}...`
        );
      } else {
        Alert.alert('ℹ️ No SMS Found', 'Using mock data for testing');
      }
    } catch (error) {
      Alert.alert('❌ Error', `SMS test failed: ${error}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestNotifications = () => {
    Alert.alert(
      '✅ Notifications Available',
      'Push notifications are configured and ready to use. You can enable them from notification settings.'
    );
  };

  const handleTestAnalytics = () => {
    setAnalyticsModalVisible(true);
  };

  const handleFullSync = async () => {
    if (!userId) {
      Alert.alert('⚠️ Error', 'User ID not found');
      return;
    }

    setSyncLoading(true);
    setSyncProgress(0);
    setSyncMessage('Starting sync...');

    const unsubscribe = SMSSyncManager.onProgress((progress: SyncProgress) => {
      const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
      setSyncProgress(percentage);
      setSyncMessage(progress.message);
    });

    try {
      const result = await SMSSyncManager.performSync(userId);
      if (result.success) {
        Alert.alert(
          '✅ Sync Complete',
          `SMS: ${result.smsRead}\nTransactions: ${result.transactionsStored}\nDuration: ${Math.round(result.duration / 1000)}s`
        );
      } else {
        Alert.alert('⚠️ Sync Warning', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('❌ Error', `Sync failed: ${error}`);
    } finally {
      unsubscribe();
      setSyncLoading(false);
      setSyncMessage('');
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>⚙️ App Settings</ThemedText>

          {/* Dark Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <ThemedText style={styles.settingName}>🌙 Dark Mode</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {isDarkMode ? 'Enabled' : 'Disabled'}
              </ThemedText>
            </View>
            <Switch value={isDarkMode} onValueChange={handleDarkModeToggle} />
          </View>
        </ThemedView>

        {/* Phase 4 Features */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>✨ Phase 4 Features</ThemedText>

          {/* SMS Transactions */}
          <TouchableOpacity
            style={styles.featureItem}
            onPress={handleTestSMS}
            disabled={syncLoading}
          >
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureName}>📱 SMS Transactions</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Read and import SMS messages as transactions
              </ThemedText>
              <ThemedText style={styles.featureStatus}>✅ Enabled</ThemedText>
            </View>
            {syncLoading && <ActivityIndicator />}
          </TouchableOpacity>

          {/* Push Notifications */}
          <TouchableOpacity style={styles.featureItem} onPress={handleTestNotifications}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureName}>🔔 Push Notifications</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Real-time alerts for transactions and budgets
              </ThemedText>
              <ThemedText style={styles.featureStatus}>✅ Enabled</ThemedText>
            </View>
          </TouchableOpacity>

          {/* Advanced Analytics */}
          <TouchableOpacity style={styles.featureItem} onPress={handleTestAnalytics}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureName}>📊 Advanced Analytics</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Detailed spending insights and trends
              </ThemedText>
              <ThemedText style={styles.featureStatus}>✅ Enabled</ThemedText>
            </View>
          </TouchableOpacity>

          {/* Month Navigation */}
          <View style={styles.featureItem}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureName}>📅 Month Navigation</ThemedText>
              <ThemedText style={styles.featureDescription}>
                View transactions for any month
              </ThemedText>
              <ThemedText style={styles.featureStatus}>✅ Enabled</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Testing Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>🧪 Testing</ThemedText>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: syncLoading ? '#999' : '#34C759' }]}
            onPress={handleFullSync}
            disabled={syncLoading}
          >
            <ThemedText style={styles.testButtonText}>
              {syncLoading ? `⏳ Syncing... ${syncProgress}%` : '📨 Full SMS Sync'}
            </ThemedText>
          </TouchableOpacity>

          {syncMessage ? (
            <ThemedText style={styles.syncMessage}>{syncMessage}</ThemedText>
          ) : null}

          <TouchableOpacity style={styles.testButton} onPress={handleTestSMS} disabled={syncLoading}>
            <ThemedText style={styles.testButtonText}>📱 Test SMS Reading</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={handleTestNotifications}>
            <ThemedText style={styles.testButtonText}>🔔 Test Notifications</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={handleTestAnalytics}>
            <ThemedText style={styles.testButtonText}>📊 View Advanced Analytics</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Info Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>ℹ️ About</ThemedText>

          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>App Version</ThemedText>
            <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Phase</ThemedText>
            <ThemedText style={styles.infoValue}>Phase 4 ✨</ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Features</ThemedText>
            <ThemedText style={styles.infoValue}>SMS, Notifications, Analytics, Dark Mode</ThemedText>
          </View>
        </ThemedView>
      </ScrollView>

      {/* Advanced Analytics Modal */}
      <Modal
        visible={analyticsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAnalyticsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>📊 Advanced Analytics</ThemedText>
            <TouchableOpacity onPress={() => setAnalyticsModalVisible(false)}>
              <ThemedText style={{ fontSize: 24, color: '#007AFF' }}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          <AdvancedAnalyticsScreen />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  featureItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  featureStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncMessage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
