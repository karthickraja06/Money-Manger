/**
 * Budget Screen
 * 
 * Features:
 * - Set budget limits per category
 * - Track spending vs budget
 * - Visual progress indicators
 * - Budget alerts
 * - Monthly breakdown
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useStore } from '../../store/appStore';
import { DatabaseService } from '../../services';
import { TransactionCategory } from '../../types';

interface Budget {
  category: TransactionCategory;
  limit: number;
  spent: number;
  percentage: number;
}

const CATEGORIES: TransactionCategory[] = [
  'Food', 'Entertainment', 'Travel', 'Shopping', 'Utilities',
  'Medical', 'Education', 'Rent', 'Bills', 'Insurance',
  'Gifts', 'Other'
];

const DEFAULT_BUDGETS: Record<TransactionCategory, number> = {
  'Food': 10000,
  'Entertainment': 3000,
  'Travel': 5000,
  'Shopping': 8000,
  'Utilities': 2000,
  'Salary': 0,
  'Medical': 5000,
  'Education': 3000,
  'Rent': 15000,
  'Savings': 0,
  'Investment': 0,
  'Bills': 2000,
  'Loan': 0,
  'Insurance': 1000,
  'Gifts': 2000,
  'Refund': 0,
  'Other': 1000,
};

export const BudgetScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, selectedMonth]);

  const loadData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load transactions for current month
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const result = await DatabaseService.getTransactions(userId, 10000, 0);
      const monthlyTxns = result.data.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= startDate && txnDate <= endDate && t.type === 'debit';
      });

      setTransactions(monthlyTxns);

      // Calculate budgets
      const calculatedBudgets: Budget[] = CATEGORIES.map(category => {
        const spent = monthlyTxns
          .filter(t => t.category_id === category)
          .reduce((sum, t) => sum + t.amount, 0);

        const limit = DEFAULT_BUDGETS[category];
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          category,
          limit,
          spent,
          percentage: Math.min(percentage, 100),
        };
      }).filter(b => b.limit > 0);

      setBudgets(calculatedBudgets);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = () => {
    if (!selectedCategory || !budgetInput) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Budget must be a positive number');
      return;
    }

    DEFAULT_BUDGETS[selectedCategory] = amount;
    setBudgetInput('');
    setSelectedCategory(null);
    setShowModal(false);
    loadData();
  };

  const getTotalBudget = () => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  };

  const getOverBudgetCount = () => {
    return budgets.filter(b => b.spent > b.limit).length;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#d32f2f';
    if (percentage >= 80) return '#ff9800';
    if (percentage >= 50) return '#ffc107';
    return '#4caf50';
  };

  const renderBudgetItem = (item: Budget) => (
    <TouchableOpacity
      key={item.category}
      style={styles.budgetItem}
      onPress={() => {
        setSelectedCategory(item.category);
        setBudgetInput(item.limit.toString());
        setShowModal(true);
      }}
    >
      <View style={styles.budgetHeader}>
        <View>
          <Text style={styles.categoryName}>{item.category}</Text>
          <Text style={styles.budgetText}>
            {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
          </Text>
        </View>
        <Text style={[
          styles.percentageText,
          { color: getProgressColor(item.percentage) }
        ]}>
          {item.percentage.toFixed(0)}%
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${item.percentage}%`,
              backgroundColor: getProgressColor(item.percentage),
            }
          ]}
        />
      </View>

      {item.spent > item.limit && (
        <Text style={styles.overBudgetText}>
          ⚠️ Over budget by {formatCurrency(item.spent - item.limit)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const monthString = selectedMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Navigation */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>◀</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>{monthString}</Text>

        <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <>
          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Total Budget</Text>
              <Text style={styles.overviewValue}>
                {formatCurrency(getTotalBudget())}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Total Spent</Text>
              <Text style={[
                styles.overviewValue,
                { color: getTotalSpent() > getTotalBudget() ? '#d32f2f' : '#333' }
              ]}>
                {formatCurrency(getTotalSpent())}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Remaining</Text>
              <Text style={[
                styles.overviewValue,
                { color: getTotalBudget() - getTotalSpent() >= 0 ? '#4caf50' : '#d32f2f' }
              ]}>
                {formatCurrency(getTotalBudget() - getTotalSpent())}
              </Text>
            </View>
          </View>

          {/* Alert for Over Budget */}
          {getOverBudgetCount() > 0 && (
            <View style={styles.alertBox}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Budget Alert</Text>
                <Text style={styles.alertMessage}>
                  {getOverBudgetCount()} categor{getOverBudgetCount() > 1 ? 'ies' : 'y'} exceeded budget
                </Text>
              </View>
            </View>
          )}

          {/* Budget List */}
          <View style={styles.budgetsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Category Budgets</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setSelectedCategory(null);
                  setBudgetInput('');
                  setShowModal(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {budgets.length > 0 ? (
              budgets.map(renderBudgetItem)
            ) : (
              <Text style={styles.emptyText}>No budgets set. Tap + Add to create one.</Text>
            )}
          </View>

          {/* Set Budget Modal */}
          <Modal
            visible={showModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set Budget Limit</Text>

                {/* Category Selector */}
                <Text style={styles.modalLabel}>Category</Text>
                <FlatList
                  data={CATEGORIES}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        selectedCategory === item && styles.categoryOptionSelected
                      ]}
                      onPress={() => setSelectedCategory(item)}
                    >
                      <Text style={styles.categoryOptionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                  numColumns={3}
                  columnWrapperStyle={styles.categoryGrid}
                  keyExtractor={(item) => item}
                />

                {/* Budget Input */}
                {selectedCategory && (
                  <>
                    <Text style={styles.modalLabel}>Budget Amount (₹)</Text>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="Enter amount"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      value={budgetInput}
                      onChangeText={setBudgetInput}
                    />
                  </>
                )}

                {/* Action Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSetBudget}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Tips */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 Budget Tips</Text>
            <Text style={styles.tipItem}>• Set realistic limits based on your spending patterns</Text>
            <Text style={styles.tipItem}>• Review and adjust monthly based on actual spending</Text>
            <Text style={styles.tipItem}>• Create separate budgets for fixed and variable expenses</Text>
            <Text style={styles.tipItem}>• Use 50-30-20 rule: 50% needs, 30% wants, 20% savings</Text>
          </View>
        </>
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthButtonText: {
    fontSize: 20,
    color: '#2196F3',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  overviewGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6f00',
  },
  alertMessage: {
    fontSize: 12,
    color: '#ff6f00',
    marginTop: 4,
  },
  budgetsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  budgetItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  budgetText: {
    fontSize: 12,
    color: '#666',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  categoryGrid: {
    gap: 8,
    marginBottom: 12,
  },
  categoryOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tipsBox: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    color: '#1b5e20',
    marginBottom: 6,
    lineHeight: 18,
  },
});
