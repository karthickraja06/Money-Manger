/**
 * PHASE 7: Dues List Screen
 * Display and manage dues and reminders
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/src/context/ThemeContext';
import { DuesService, DueWithDetails } from '@/src/services/duesService';
import { ReminderService } from '@/src/services/reminderService';
import { useStore } from '@/src/store/appStore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export function DuesScreen() {
  const { isDarkMode } = useTheme();
  const userId = useStore((state) => state.user?.id);

  const [dues, setDues] = useState<DueWithDetails[]>([]);
  const [overdueDues, setOverdueDues] = useState<DueWithDetails[]>([]);
  const [upcomingDues, setUpcomingDues] = useState<DueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueType, setDueType] = useState<'pay' | 'receive'>('pay');

  useEffect(() => {
    if (!userId) return;

    const loadDues = async () => {
      try {
        setLoading(true);
        const [allDues, overdue, upcoming] = await Promise.all([
          DuesService.getDues(userId),
          DuesService.getOverdueDues(userId),
          DuesService.getUpcomingDues(userId),
        ]);

        setDues(allDues);
        setOverdueDues(overdue);
        setUpcomingDues(upcoming);
      } catch (error) {
        console.error('Failed to load dues:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDues();
  }, [userId]);

  const handleCreateDue = async () => {
    if (!userId || !contactName || !amount || !dueDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const dueDateObj = new Date(dueDate);
      await DuesService.createDue(
        userId,
        contactName,
        parseFloat(amount),
        dueDateObj,
        undefined,
        undefined
      );

      // Schedule reminder
      await ReminderService.scheduleDueReminder(
        `due_${Date.now()}`,
        contactName,
        dueDateObj,
        parseFloat(amount),
        { daysBeforeDue: 1, enabled: true }
      );

      // Reload dues
      const allDues = await DuesService.getDues(userId);
      setDues(allDues);

      setModalVisible(false);
      setContactName('');
      setAmount('');
      setDueDate('');
    } catch (error) {
      console.error('Failed to create due:', error);
      Alert.alert('Error', 'Failed to create due');
    }
  };

  const handleCompleteDue = async (dueId: string) => {
    if (!userId) return;

    try {
      await DuesService.completeDue(userId, dueId);
      const allDues = await DuesService.getDues(userId);
      setDues(allDues);
    } catch (error) {
      console.error('Failed to complete due:', error);
    }
  };

  const renderDueCard = (due: DueWithDetails) => (
    <View
      key={due.id}
      style={[styles.dueCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}
    >
      <View style={styles.cardHeader}>
        <View>
          <ThemedText style={styles.contactName}>{due.contact_name}</ThemedText>
          <ThemedText style={styles.dueType}>
            {'💳 To Pay'}
          </ThemedText>
        </View>
        <ThemedText style={[
          styles.amount,
          { color: '#FF3B30' }
        ]}>
          ₹{due.amount.toLocaleString('en-IN')}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <ThemedText style={[
          styles.dueStatus,
          {
            color: due.isOverdue ? '#FF3B30' : due.daysDue === 0 ? '#FF9500' : '#34C759'
          }
        ]}>
          {due.isOverdue
            ? `⚠️ ${Math.abs(due.daysDue || 0)} days overdue`
            : due.daysDue === 0
              ? '📌 Due today'
              : `📅 Due in ${due.daysDue} days`}
        </ThemedText>

        {due.status === 'pending' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteDue(due.id)}
          >
            <ThemedText style={styles.completeButtonText}>✓ Done</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>📋 Dues & Reminders</ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <ThemedText style={styles.addButtonText}>+ New Due</ThemedText>
          </TouchableOpacity>
        </View>

        {overdueDues.length > 0 && (
          <View>
            <ThemedText style={styles.sectionTitle}>⚠️ Overdue ({overdueDues.length})</ThemedText>
            {overdueDues.map((due) => renderDueCard(due))}
          </View>
        )}

        {upcomingDues.length > 0 && (
          <View>
            <ThemedText style={styles.sectionTitle}>📌 Upcoming ({upcomingDues.length})</ThemedText>
            {upcomingDues.map((due) => renderDueCard(due))}
          </View>
        )}

        {dues.filter((d) => d.status === 'completed').length > 0 && (
          <View>
            <ThemedText style={styles.sectionTitle}>✅ Completed</ThemedText>
            {dues
              .filter((d) => d.status === 'completed')
              .map((due) => renderDueCard(due))}
          </View>
        )}

        {dues.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No dues yet</ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' },
            ]}
          >
            <ThemedText style={styles.modalTitle}>Add New Due</ThemedText>

            <ThemedText style={styles.label}>Contact Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
                  color: isDarkMode ? '#fff' : '#000',
                },
              ]}
              placeholder="Enter contact name"
              placeholderTextColor={isDarkMode ? '#999' : '#ccc'}
              value={contactName}
              onChangeText={setContactName}
            />

            <ThemedText style={styles.label}>Amount</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
                  color: isDarkMode ? '#fff' : '#000',
                },
              ]}
              placeholder="Enter amount"
              placeholderTextColor={isDarkMode ? '#999' : '#ccc'}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <ThemedText style={styles.label}>Due Date (YYYY-MM-DD)</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
                  color: isDarkMode ? '#fff' : '#000',
                },
              ]}
              placeholder="2025-12-31"
              placeholderTextColor={isDarkMode ? '#999' : '#ccc'}
              value={dueDate}
              onChangeText={setDueDate}
            />

            <ThemedText style={styles.label}>Type</ThemedText>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  dueType === 'pay' && styles.activeTypeButton,
                ]}
                onPress={() => setDueType('pay')}
              >
                <ThemedText style={styles.typeButtonText}>💳 To Pay</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  dueType === 'receive' && styles.activeTypeButton,
                ]}
                onPress={() => setDueType('receive')}
              >
                <ThemedText style={styles.typeButtonText}>💰 To Receive</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateDue}
              >
                <ThemedText style={styles.buttonText}>Create Due</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dueCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dueType: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
