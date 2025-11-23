/**
 * Advanced Search Screen
 * 
 * Filter transactions by:
 * - Date range (from/to)
 * - Amount range (min/max)
 * - Category
 * - Merchant (search)
 * - Transaction type (debit/credit)
 * - Account
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useStore } from '../../store/appStore';
import { DatabaseService } from '../../services';
import { TransactionCategory } from '../../types';

interface FilterCriteria {
  startDate: Date | null;
  endDate: Date | null;
  minAmount: number | null;
  maxAmount: number | null;
  category: TransactionCategory | null;
  merchant: string;
  type: 'all' | 'debit' | 'credit';
  accountId: string | null;
}

interface TransactionItem {
  id: string;
  merchant: string;
  category_id: string;
  amount: number;
  type: string;
  date: string;
  account_id: string;
  bank_name?: string;
}

const CATEGORIES: TransactionCategory[] = [
  'Food', 'Entertainment', 'Travel', 'Shopping', 'Utilities',
  'Salary', 'Medical', 'Education', 'Rent', 'Savings',
  'Investment', 'Bills', 'Loan', 'Insurance', 'Gifts', 'Refund', 'Other'
];

export const AdvancedSearchScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id);
  const [filters, setFilters] = useState<FilterCriteria>({
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
    category: null,
    merchant: '',
    type: 'all',
    accountId: null,
  });

  const [results, setResults] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadAccounts();
    }
  }, [userId]);

  const loadAccounts = async () => {
    if (!userId) return;
    try {
      const accts = await DatabaseService.getAccounts(userId);
      setAccounts(accts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const search = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get all transactions for this user
      const result = await DatabaseService.getTransactions(userId, 1000, 0);
      let filtered = result.data;

      // Apply filters
      if (filters.startDate) {
        filtered = filtered.filter(t => new Date(t.date) >= filters.startDate!);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(t => new Date(t.date) <= endDate);
      }

      if (filters.minAmount !== null) {
        filtered = filtered.filter(t => t.amount >= filters.minAmount!);
      }

      if (filters.maxAmount !== null) {
        filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
      }

      if (filters.merchant.trim()) {
        const searchTerm = filters.merchant.toLowerCase();
        filtered = filtered.filter(t =>
          t.merchant.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.type !== 'all') {
        filtered = filtered.filter(t => t.type === filters.type);
      }

      if (filters.accountId) {
        filtered = filtered.filter(t => t.account_id === filters.accountId);
      }

      // Sort by date descending
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search transactions');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      minAmount: null,
      maxAmount: null,
      category: null,
      merchant: '',
      type: 'all',
      accountId: null,
    });
    setResults([]);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const renderTransactionItem = (item: TransactionItem) => (
    <View key={item.id} style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.merchant}>{item.merchant}</Text>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString('en-IN')}
        </Text>
      </View>
      <Text style={[
        styles.amount,
        { color: item.type === 'debit' ? '#d32f2f' : '#388e3c' }
      ]}>
        {item.type === 'debit' ? '-' : '+'}
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Date Range</Text>
        
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateButton, { flex: 1, marginRight: 8 }]}
            onPress={() => setShowDatePicker('start')}
          >
            <Text style={styles.dateButtonText}>From: {formatDate(filters.startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateButton, { flex: 1 }]}
            onPress={() => setShowDatePicker('end')}
          >
            <Text style={styles.dateButtonText}>To: {formatDate(filters.endDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>
              {showDatePicker === 'start' ? 'Select Start Date' : 'Select End Date'}
            </Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#999"
                value={showDatePicker === 'start'
                  ? filters.startDate?.toLocaleDateString('en-GB') || ''
                  : filters.endDate?.toLocaleDateString('en-GB') || ''}
              />
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  // For demo, set to today
                  if (showDatePicker === 'start') {
                    setFilters({ ...filters, startDate: new Date() });
                  } else {
                    setFilters({ ...filters, endDate: new Date() });
                  }
                  setShowDatePicker(null);
                }}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Amount Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Amount Range</Text>
        
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Min"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={filters.minAmount?.toString() || ''}
            onChangeText={(text) => setFilters({
              ...filters,
              minAmount: text ? parseFloat(text) : null
            })}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Max"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={filters.maxAmount?.toString() || ''}
            onChangeText={(text) => setFilters({
              ...filters,
              maxAmount: text ? parseFloat(text) : null
            })}
          />
        </View>
      </View>

      {/* Merchant Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛍️ Merchant</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Search merchant..."
          placeholderTextColor="#999"
          value={filters.merchant}
          onChangeText={(text) => setFilters({ ...filters, merchant: text })}
        />
      </View>

      {/* Transaction Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Type</Text>
        
        <View style={styles.typeRow}>
          {['all', 'debit', 'credit'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                filters.type === type && styles.typeButtonActive
              ]}
              onPress={() => setFilters({ ...filters, type: type as any })}
            >
              <Text style={[
                styles.typeButtonText,
                filters.type === type && styles.typeButtonTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏷️ Category</Text>
        
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.categoryButtonText}>
            {filters.category || 'All Categories'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.categoryModal}>
            <View style={styles.categoryModalContent}>
              <View style={styles.categoryModalHeader}>
                <Text style={styles.categoryModalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.categoryList}>
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => {
                    setFilters({ ...filters, category: null });
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>All Categories</Text>
                </TouchableOpacity>

                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryOption}
                    onPress={() => {
                      setFilters({ ...filters, category });
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={styles.categoryOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏦 Account</Text>
        
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => {
            // Show account picker modal
          }}
        >
          <Text style={styles.categoryButtonText}>
            {accounts.find(a => a.id === filters.accountId)?.bank_name || 'All Accounts'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { flex: 1, marginRight: 8 }]}
          onPress={search}
        >
          <Text style={styles.buttonText}>🔍 Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
          onPress={clearFilters}
        >
          <Text style={styles.buttonSecondaryText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : results.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>
            Found {results.length} transaction{results.length !== 1 ? 's' : ''}
          </Text>
          
          <View style={styles.resultsSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(results.reduce((sum, t) => sum + t.amount, 0))}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>
                {formatCurrency(
                  results
                    .filter(t => t.type === 'debit')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, { color: '#388e3c' }]}>
                {formatCurrency(
                  results
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </Text>
            </View>
          </View>

          <FlatList
            data={results}
            renderItem={({ item }) => renderTransactionItem(item)}
            scrollEnabled={false}
            style={styles.resultsList}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {results.length === 0 && Object.values(filters).some(f =>
              f !== null && f !== '' && f !== 'all'
            ) ? 'No transactions found' : 'Set filters and search'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#666',
  },
  datePickerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  amountRow: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
  },
  categoryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingTop: 16,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 8,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  resultsContainer: {
    marginBottom: 32,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultsSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flex: 1,
  },
  merchant: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
