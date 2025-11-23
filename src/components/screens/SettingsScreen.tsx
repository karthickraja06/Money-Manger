import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { useStore } from '../../store/appStore';
import { SMSSyncManager } from '../../services/smsSyncManager';

export const SettingsScreen: React.FC = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [autoSync, setAutoSync] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deviceName, setDeviceName] = useState('My Phone');
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const result = await SMSSyncManager.performSync(user?.id || '');
      if (result.success) {
        Alert.alert('✅ Success', `Synced ${result.smsProcessed} SMS messages`);
      } else {
        Alert.alert('❌ Failed', result.errors[0] || 'Sync failed');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Clear All Data?',
      'This will delete all transactions and accounts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you'd call a service to clear data
              Alert.alert('✅ Data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout?', 'You will be logged out of the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          setUser(null);
          Alert.alert('✅ Logged out');
        },
      },
    ]);
  };

  const renderSectionHeader = (title: string, emoji: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{emoji} {title}</Text>
    </View>
  );

  const renderSettingRow = (
    label: string,
    value: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      {renderSectionHeader('Account', '👤')}
      <View style={styles.section}>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{deviceName}</Text>
            <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
            <Text style={styles.userMeta}>Active • {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {renderSettingRow(
          'Device Name',
          deviceName,
          () => setEditModalVisible(true)
        )}

        {renderSettingRow(
          'Account Created',
          new Date(user?.created_at || '').toLocaleDateString('en-IN')
        )}
      </View>

      {/* Sync Settings */}
      {renderSectionHeader('Sync Settings', '📱')}
      <View style={styles.section}>
        {renderSettingRow(
          'Auto Sync SMS',
          autoSync ? 'Enabled' : 'Disabled',
          undefined,
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: '#ddd', true: '#81C784' }}
            thumbColor={autoSync ? '#4CAF50' : '#f4f3f4'}
          />
        )}

        {renderSettingRow(
          'Sync Frequency',
          'Every 30 minutes',
          () => Alert.alert('Sync Frequency', 'Set sync interval')
        )}

        <TouchableOpacity
          style={[styles.settingRow, styles.actionButton]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          <Text style={styles.actionButtonText}>
            {syncing ? '⏳ Syncing...' : '🔄 Manual Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      {renderSectionHeader('Notifications', '🔔')}
      <View style={styles.section}>
        {renderSettingRow(
          'Enable Notifications',
          notificationsEnabled ? 'On' : 'Off',
          undefined,
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ddd', true: '#81C784' }}
            thumbColor={notificationsEnabled ? '#4CAF50' : '#f4f3f4'}
          />
        )}

        {renderSettingRow(
          'Budget Alerts',
          'When 80% spent',
          () => Alert.alert('Budget Alerts', 'Configure alert thresholds')
        )}

        {renderSettingRow(
          'Daily Digest',
          '9:00 PM',
          () => Alert.alert('Daily Digest', 'Set time for daily summary')
        )}
      </View>

      {/* App Preferences */}
      {renderSectionHeader('Preferences', '⚙️')}
      <View style={styles.section}>
        {renderSettingRow(
          'Currency',
          'Indian Rupee (₹)',
          () => Alert.alert('Currency', 'Select your currency')
        )}

        {renderSettingRow(
          'Date Format',
          'DD/MM/YYYY',
          () => Alert.alert('Date Format', 'Choose date format')
        )}

        {renderSettingRow(
          'Theme',
          'Light',
          () => Alert.alert('Theme', 'Select app theme')
        )}
      </View>

      {/* Data & Privacy */}
      {renderSectionHeader('Data & Privacy', '🔒')}
      <View style={styles.section}>
        {renderSettingRow(
          'Privacy Policy',
          'View',
          () => Alert.alert('Privacy Policy', 'Opening privacy policy...')
        )}

        {renderSettingRow(
          'Terms of Service',
          'View',
          () => Alert.alert('Terms of Service', 'Opening terms...')
        )}

        <TouchableOpacity
          style={[styles.settingRow, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Text style={styles.dangerButtonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      {renderSectionHeader('About', 'ℹ️')}
      <View style={styles.section}>
        {renderSettingRow(
          'App Version',
          '2.0.0'
        )}

        {renderSettingRow(
          'Build',
          'Phase 2 - SMS Sync'
        )}

        {renderSettingRow(
          'Last Updated',
          new Date().toLocaleDateString('en-IN')
        )}
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.settingRow, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>📤 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for better money management</Text>
      </View>

      {/* Edit Device Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Device Name</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Enter device name"
                value={deviceName}
                onChangeText={setDeviceName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  Alert.alert('✅ Device name updated');
                  setEditModalVisible(false);
                }}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#E8F4FF',
    borderBottomWidth: 0,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FFE5E5',
    borderBottomWidth: 0,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  logoutButton: {
    backgroundColor: '#fff3f3',
    borderBottomWidth: 0,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
