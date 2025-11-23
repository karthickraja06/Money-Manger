import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useStore } from '../../store/appStore';
import { Transaction } from '../../types';

const { width } = Dimensions.get('window');

export const AnalyticsScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id) || '';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [userId, period]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await DatabaseService.getTransactions(userId, 500, 0);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const getExpenseByCategory = () => {
    const filtered = getFilteredTransactions();
    const categories: { [key: string]: number } = {};

    filtered.forEach(txn => {
      if (txn.is_expense) {
        const category = txn.merchant || 'Other';
        categories[category] = (categories[category] || 0) + txn.net_amount;
      }
    });

    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getTotalExpense = () => {
    return getFilteredTransactions()
      .filter(t => t.is_expense)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getTotalIncome = () => {
    return getFilteredTransactions()
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getAverageTransaction = () => {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, t) => sum + t.net_amount, 0);
    return total / filtered.length;
  };

  const expenseByCategory = getExpenseByCategory();
  const totalExpense = getTotalExpense();
  const totalIncome = getTotalIncome();
  const avgTransaction = getAverageTransaction();
  const transactionCount = getFilteredTransactions().length;

  const renderStatBox = (title: string, value: string, color: string) => (
    <View style={[styles.statBox, { backgroundColor: color }]}>
      <Text style={styles.statBoxTitle}>{title}</Text>
      <Text style={styles.statBoxValue}>{value}</Text>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: { name: string; amount: number } }) => {
    const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
    
    return (
      <View style={styles.categoryRow}>
        <View style={styles.categoryRowLeft}>
          <Text style={styles.categoryRowName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.categoryProgressBar, { backgroundColor: '#f0f0f0' }]}>
            <View
              style={[
                styles.categoryProgressFill,
                { width: `${percentage}%`, backgroundColor: '#007AFF' }
              ]}
            />
          </View>
        </View>
        <View style={styles.categoryRowRight}>
          <Text style={styles.categoryRowAmount}>₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          <Text style={styles.categoryRowPercent}>{percentage.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your spending</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive,
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Stats */}
      <View style={styles.statsGrid}>
        {renderStatBox('Total Expense', `₹${totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '#FFE5E5')}
        {renderStatBox('Total Income', `₹${totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '#E5F5E5')}
      </View>

      <View style={styles.statsGrid}>
        {renderStatBox('Avg Transaction', `₹${avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '#E5E5FF')}
        {renderStatBox('Total Transactions', transactionCount.toString(), '#FFF5E5')}
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Balance Change</Text>
          <Text style={[styles.summaryValue, { color: totalIncome >= totalExpense ? '#34C759' : '#FF3B30' }]}>
            ₹{(totalIncome - totalExpense).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Expense Breakdown */}
      {expenseByCategory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Expense Breakdown</Text>
            <Text style={styles.sectionSubtitle}>{expenseByCategory.length} categories</Text>
          </View>

          <FlatList
            data={expenseByCategory}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.name}
            scrollEnabled={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>
      )}

      {/* Top Merchants */}
      {transactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏪 Top Merchants</Text>
          </View>

          {(() => {
            const merchantData = getFilteredTransactions()
              .reduce((acc: { [key: string]: number }, t) => {
                acc[t.merchant || 'Unknown'] = (acc[t.merchant || 'Unknown'] || 0) + 1;
                return acc;
              }, {});
            
            const merchantList = Object.entries(merchantData).map(([name, count]) => ({ name, count }));

            return (
              <FlatList
                data={merchantList}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.merchantRow}>
                    <Text style={styles.merchantName}>{item.name}</Text>
                    <View style={styles.merchantBadge}>
                      <Text style={styles.merchantCount}>{item.count}</Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.name}
                contentContainerStyle={styles.merchantList}
              />
            );
          })()}
        </View>
      )}

      {/* Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💡 Insights</Text>
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightEmoji}>📊</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Average Daily Spending</Text>
            <Text style={styles.insightValue}>
              ₹{period === 'month' ? (totalExpense / 30).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightEmoji}>🎯</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Most Expensive Category</Text>
            <Text style={styles.insightValue}>
              {expenseByCategory[0]?.name || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Tip: Monitor your spending to stay within budget</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  statBoxTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
  },
  categoryRowRight: {
    alignItems: 'flex-end',
  },
  categoryRowAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  categoryRowPercent: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  merchantList: {
    gap: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  merchantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  merchantBadge: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  merchantCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
});
