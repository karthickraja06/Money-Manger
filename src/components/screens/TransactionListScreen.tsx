import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SectionList,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useStore } from '../../store/appStore';
import { Transaction } from '../../types';

interface GroupedTransactions {
  title: string;
  data: Transaction[];
}

export const TransactionListScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id) || '';
  const [transactions, setTransactions] = useState<GroupedTransactions[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<GroupedTransactions[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'debit', 'credit'
    search: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await DatabaseService.getTransactions(userId);
      const txns = response.data;

      // Group by date
      const grouped = groupByDate(txns);
      setTransactions(grouped);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadTransactions();
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const groupByDate = (txns: Transaction[]): GroupedTransactions[] => {
    const grouped: { [key: string]: Transaction[] } = {};

    txns.forEach((txn) => {
      const date = new Date(txn.date);
      const dateKey = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(txn);
    });

    return Object.entries(grouped).map(([date, txns]) => ({
      title: date,
      data: txns.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
  };

  const applyFilters = () => {
    let result = transactions;

    // Filter by type
    if (filters.type !== 'all') {
      result = result.map((group) => ({
        ...group,
        data: group.data.filter((txn) => txn.type === filters.type),
      }));
    }

    // Filter by search
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.map((group) => ({
        ...group,
        data: group.data.filter(
          (txn) =>
            txn.merchant?.toLowerCase().includes(searchLower) ||
            (txn.notes && txn.notes.toLowerCase().includes(searchLower))
        ),
      }));
    }

    // Filter by amount range
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      result = result.map((group) => ({
        ...group,
        data: group.data.filter((txn) => txn.amount >= minAmount),
      }));
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      result = result.map((group) => ({
        ...group,
        data: group.data.filter((txn) => txn.amount <= maxAmount),
      }));
    }

    // Remove empty groups
    result = result.filter((group) => group.data.length > 0);

    setFilteredTransactions(result);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => setSelectedTransaction(item)}
    >
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionMerchant}>{item.merchant || 'Transaction'}</Text>
        <Text style={styles.transactionCategory}>{item.notes || item.type}</Text>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === 'credit' ? '#34C759' : '#FF3B30' },
          ]}
        >
          {item.type === 'credit' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
        </Text>
        <Text style={styles.transactionBalance}>
          Net: ₹{item.net_amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Transactions</Text>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>⚙️ Filter</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <SectionList
        sections={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '⏳ Loading transactions...' : '📭 No transactions found'}
            </Text>
          </View>
        }
      />

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Modal
          visible={!!selectedTransaction}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTransaction(null)}
        >
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.date).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Merchant</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.merchant || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.notes || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Original Amount</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}₹
                    {Math.abs(selectedTransaction.original_amount).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Amount</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: selectedTransaction.type === 'credit' ? '#34C759' : '#FF3B30' },
                      { fontSize: 16, fontWeight: 'bold' },
                    ]}
                  >
                    {selectedTransaction.type === 'credit' ? '+' : '-'}₹
                    {Math.abs(selectedTransaction.net_amount).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.is_income ? '📥 Income' : selectedTransaction.is_expense ? '📤 Expense' : selectedTransaction.type.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account ID</Text>
                  <Text style={[styles.detailValue, { fontSize: 12 }]}>
                    {selectedTransaction.account_id}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilters({ type: 'all', search: '', minAmount: '', maxAmount: '' })}>
                <Text style={styles.resetButton}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Transaction Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Type</Text>
                <View style={styles.filterOptions}>
                  {['all', 'debit', 'credit'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.type === type && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters({ ...filters, type })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.type === type && styles.filterOptionTextActive,
                        ]}
                      >
                        {type === 'all' ? 'All' : type === 'debit' ? '📤 Debit' : '📥 Credit'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Search */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Search</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Search by merchant, category..."
                  value={filters.search}
                  onChangeText={(text) => setFilters({ ...filters, search: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Amount Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Amount Range</Text>
                <View style={styles.amountInputs}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Min"
                    keyboardType="decimal-pad"
                    value={filters.minAmount}
                    onChangeText={(text) => setFilters({ ...filters, minAmount: text })}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.amountSeparator}>-</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Max"
                    keyboardType="decimal-pad"
                    value={filters.maxAmount}
                    onChangeText={(text) => setFilters({ ...filters, maxAmount: text })}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionBalance: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
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
  resetButton: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    fontSize: 13,
    color: '#000',
  },
  amountInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    fontSize: 13,
    color: '#000',
  },
  amountSeparator: {
    color: '#999',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
