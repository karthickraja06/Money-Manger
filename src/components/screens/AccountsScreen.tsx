import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useStore } from '../../store/appStore';
import { Account } from '../../types';

export const AccountsScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id) || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: 'HDFC',
    accountNumber: '',
    balance: '0',
  });

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAccounts(userId);
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadAccounts();
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const handleAddAccount = async () => {
    if (!newAccount.accountNumber.trim()) {
      Alert.alert('Error', 'Please enter account number');
      return;
    }

    try {
      await DatabaseService.createAccount(userId, {
        bank_name: newAccount.bankName as any,
        account_number: newAccount.accountNumber,
        balance: parseFloat(newAccount.balance) || 0,
        created_from_sms: false,
        is_active: true,
      });

      Alert.alert('✅ Success', 'Account created successfully');
      setNewAccount({ bankName: 'HDFC', accountNumber: '', balance: '0' });
      setAddModalVisible(false);
      await loadAccounts();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account');
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      'Deactivate Account?',
      'The account will be marked as inactive but not deleted',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Deactivate',
          onPress: async () => {
            try {
              await DatabaseService.updateAccount(accountId, { is_active: false });
              Alert.alert('✅ Account deactivated');
              await loadAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate account');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const banks = ['HDFC', 'ICICI', 'SBI', 'Indian Bank', 'India Post', 'Paytm', 'PhonePe', 'Cash', 'Other'] as const;

  const renderAccountItem = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => setSelectedAccount(item)}
    >
      <View style={styles.accountCardLeft}>
        <View style={styles.bankIcon}>
          <Text style={styles.bankIconText}>🏦</Text>
        </View>
        <View>
          <Text style={styles.bankName}>{item.bank_name}</Text>
          <Text style={styles.accountNumber}>
            •••• {item.account_number.slice(-4)}
          </Text>
          <View style={styles.accountMeta}>
            <Text style={styles.accountMetaText}>
              {item.created_from_sms ? '📱 SMS' : '✏️ Manual'}
            </Text>
            <Text style={[styles.accountMetaText, { color: item.is_active ? '#34C759' : '#FF3B30' }]}>
              {item.is_active ? '● Active' : '● Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.accountCardRight}>
        <Text style={styles.balance}>
          ₹{item.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.updatedAt}>
          Updated {new Date(item.updated_at).toLocaleDateString('en-IN')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  };

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Accounts</Text>
          <Text style={styles.headerSubtitle}>{accounts.length} accounts</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>
            ₹{getTotalBalance().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardStat}>Active</Text>
              <Text style={styles.cardStatValue}>{accounts.filter(a => a.is_active).length}</Text>
            </View>
            <View style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)', paddingLeft: 12 }}>
              <Text style={styles.cardStat}>SMS Synced</Text>
              <Text style={styles.cardStatValue}>{accounts.filter(a => a.created_from_sms).length}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Accounts List */}
      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.1}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyTitle}>No Accounts</Text>
            <Text style={styles.emptyText}>
              Add your first account to get started{'\n'}or sync from SMS
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Account Detail Modal */}
      {selectedAccount && (
        <Modal
          visible={!!selectedAccount}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedAccount(null)}
        >
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedAccount(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Account Details</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAccount(null);
                    handleDeleteAccount(selectedAccount.id);
                  }}
                >
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Bank Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Name</Text>
                    <Text style={styles.detailValue}>{selectedAccount.bank_name}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number</Text>
                    <Text style={styles.detailValue}>
                      •••• {selectedAccount.account_number.slice(-4)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Balance</Text>
                    <Text style={[styles.detailValue, { color: '#34C759', fontSize: 16, fontWeight: 'bold' }]}>
                      ₹{selectedAccount.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Account Info</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created From SMS</Text>
                    <Text style={styles.detailValue}>
                      {selectedAccount.created_from_sms ? '✅ Yes' : '❌ No'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: selectedAccount.is_active ? '#34C759' : '#FF3B30' }
                    ]}>
                      {selectedAccount.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created At</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAccount.created_at).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAccount.updated_at).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account ID</Text>
                    <Text style={[styles.detailValue, { fontSize: 11, color: '#999' }]}>
                      {selectedAccount.id}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Account Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Account</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Bank Name</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bankSelector}
                >
                  {banks.map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[
                        styles.bankOption,
                        newAccount.bankName === bank && styles.bankOptionActive,
                      ]}
                      onPress={() => setNewAccount({ ...newAccount, bankName: bank })}
                    >
                      <Text
                        style={[
                          styles.bankOptionText,
                          newAccount.bankName === bank && styles.bankOptionTextActive,
                        ]}
                      >
                        {bank}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Account Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter account number"
                  value={newAccount.accountNumber}
                  onChangeText={(text) => setNewAccount({ ...newAccount, accountNumber: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Initial Balance</Text>
                <View style={styles.balanceInput}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.balanceInputField}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={newAccount.balance}
                    onChangeText={(text) => setNewAccount({ ...newAccount, balance: text })}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleAddAccount}
              >
                <Text style={styles.createButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalCard: {
    backgroundColor: '#667eea',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cardStat: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  cardStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  accountCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankIconText: {
    fontSize: 20,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  accountNumber: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  accountMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  accountMetaText: {
    fontSize: 10,
    color: '#999',
  },
  accountCardRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  balance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  updatedAt: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
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
    maxHeight: '90%',
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
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
  deleteButton: {
    fontSize: 16,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  bankSelector: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  bankOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  bankOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bankOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  bankOptionTextActive: {
    color: '#fff',
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    fontSize: 13,
    color: '#000',
  },
  balanceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginRight: 4,
  },
  balanceInputField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
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
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
