/**
 * PHASE 5: Filtered Results Screen
 * Displays filtered transactions with statistics and charts
 */

import { ThemedText } from '@/components/themed-text';
import { useFilter } from '@/src/context/FilterContext';
import { useTheme } from '@/src/context/ThemeContext';
import { DatabaseService } from '@/src/services/database';
import { FilterService, FilterStats } from '@/src/services/filterService';
import { useStore } from '@/src/store/appStore';
import { Transaction } from '@/src/types';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface FilteredResultsScreenProps {
  onOpenFilters: () => void;
}

const { width } = Dimensions.get('window');

export function FilteredResultsScreen({ onOpenFilters }: FilteredResultsScreenProps) {
  const { isDarkMode } = useTheme();
  const { filters, hasActiveFilters } = useFilter();
  const userId = useStore((state) => state.user?.id);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [txns, accts] = await Promise.all([
          DatabaseService.getTransactions(userId, 1000, 0).then(r => r.data),
          DatabaseService.getAccounts(userId),
        ]);
        
        setTransactions(txns);
        setAccounts(accts);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Apply filters whenever filters change
  useEffect(() => {
    const filtered = FilterService.filterTransactions(transactions, filters, accounts);
    const calculatedStats = FilterService.calculateStats(filtered, accounts);
    
    setFilteredTransactions(filtered);
    setStats(calculatedStats);
  }, [filters, transactions, accounts]);

  const renderStatCard = (label: string, value: string, color: string, emoji: string) => (
    <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <ThemedText style={styles.statEmoji}>{emoji}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: isDarkMode ? '#aaa' : '#999' }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionRow, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <View style={styles.transactionRowLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.is_income ? '#34C75920' : '#FF3B3020' }
        ]}>
          <ThemedText style={styles.transactionIconText}>
            {item.is_income ? '📥' : '📤'}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={styles.transactionName}>{item.merchant || 'Transaction'}</ThemedText>
          <ThemedText style={[styles.transactionTime, { color: isDarkMode ? '#aaa' : '#999' }]}>
            {new Date(item.date).toLocaleDateString('en-IN')}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={[
        styles.transactionAmount,
        { color: item.is_income ? '#34C759' : '#FF3B30' }
      ]}>
        {item.is_income ? '+' : '-'}₹{Math.abs(item.net_amount || item.amount).toLocaleString('en-IN')}
      </ThemedText>
    </View>
  );

  const renderCategoryBreakdown = () => {
    if (!stats || Object.keys(stats.byCategory).length === 0) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>📂 Category Breakdown</ThemedText>
        {Object.entries(stats.byCategory).map(([category, data]) => (
          <View key={category} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <ThemedText style={styles.categoryName}>
                {category}
              </ThemedText>
              <ThemedText style={[styles.categoryCount, { color: isDarkMode ? '#aaa' : '#999' }]}>
                {data.count} transaction{data.count !== 1 ? 's' : ''}
              </ThemedText>
            </View>
            <ThemedText style={styles.categoryAmount}>
              ₹{data.amount.toLocaleString('en-IN')}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const renderTopMerchants = () => {
    if (!stats || stats.byMerchant.length === 0) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🏪 Top Merchants</ThemedText>
        {stats.byMerchant.slice(0, 5).map((merchant, index) => (
          <View key={index} style={styles.merchantRow}>
            <View style={styles.merchantInfo}>
              <ThemedText style={styles.merchantName}>{merchant.merchant}</ThemedText>
              <ThemedText style={[styles.merchantCount, { color: isDarkMode ? '#aaa' : '#999' }]}>
                {merchant.count} transaction{merchant.count !== 1 ? 's' : ''}
              </ThemedText>
            </View>
            <ThemedText style={styles.merchantAmount}>
              ₹{merchant.amount.toLocaleString('en-IN')}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const updateFilter = (key: string, value: any) => {
    // Update the filter context with the new value
    // This function should be implemented to update the actual filter context
  };

  const renderRefundFilter = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>🔗 Refund Status</ThemedText>
      <TouchableOpacity
        style={[styles.filterButton, filters.refundStatus === 'linked' && styles.activeFilter]}
        onPress={() => updateFilter('refundStatus', 'linked')}
      >
        <ThemedText>Linked Refunds</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filters.refundStatus === 'unlinked' && styles.activeFilter]}
        onPress={() => updateFilter('refundStatus', 'unlinked')}
      >
        <ThemedText>Unlinked Refunds</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, !filters.refundStatus && styles.activeFilter]}
        onPress={() => updateFilter('refundStatus', null)}
      >
        <ThemedText>All Transactions</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderBottomColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
          <ThemedText style={styles.headerTitle}>📊 Filtered Results</ThemedText>
          <TouchableOpacity onPress={onOpenFilters} style={styles.filterButton}>
            <ThemedText style={styles.filterButtonText}>
              🔧 {hasActiveFilters() ? 'Filters Active' : 'Add Filters'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {stats && (
          <>
            <View style={styles.statsGrid}>
              {renderStatCard('Total Transactions', stats.totalTransactions.toString(), '#007AFF', '📊')}
              {renderStatCard('Total Debit', `₹${stats.totalDebit.toLocaleString('en-IN')}`, '#FF3B30', '📤')}
              {renderStatCard('Total Credit', `₹${stats.totalCredit.toLocaleString('en-IN')}`, '#34C759', '📥')}
              {renderStatCard('Net Amount', `₹${stats.totalNet.toLocaleString('en-IN')}`, stats.totalNet >= 0 ? '#34C759' : '#FF3B30', '💰')}
            </View>

            {/* Summary Cards */}
            <View style={styles.section}>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderLeftColor: '#FF3B30' }]}>
                <ThemedText style={[styles.summaryLabel, { color: isDarkMode ? '#aaa' : '#999' }]}>
                  Debit Transactions
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#FF3B30' }]}>
                  {stats.debitCount} transactions
                </ThemedText>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderLeftColor: '#34C759' }]}>
                <ThemedText style={[styles.summaryLabel, { color: isDarkMode ? '#aaa' : '#999' }]}>
                  Credit Transactions
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#34C759' }]}>
                  {stats.creditCount} transactions
                </ThemedText>
              </View>
            </View>

            {/* Category Breakdown */}
            {renderCategoryBreakdown()}

            {/* Top Merchants */}
            {renderTopMerchants()}
          </>
        )}

        {/* Refund Filter */}
        {renderRefundFilter()}

        {/* Transactions List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            📋 Transactions ({filteredTransactions.length})
          </ThemedText>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No transactions match your filters
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,122,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(52,199,89,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  merchantCount: {
    fontSize: 12,
    marginTop: 4,
  },
  merchantAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionName: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionTime: {
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
  activeFilter: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
});
