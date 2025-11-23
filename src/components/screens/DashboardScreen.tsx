import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useStore } from '../../store/appStore';
import { Account, Transaction } from '../../types';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const userId = useStore((state) => state.user?.id);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [accts, txns] = await Promise.all([
        DatabaseService.getAccounts(userId),
        DatabaseService.getTransactions(userId, 10, 0).then(r => r.data),
      ]);
      setAccounts(accts);
      setRecentTransactions(txns);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getTodayTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return recentTransactions.filter(txn => {
      const txnDate = new Date(txn.date);
      txnDate.setHours(0, 0, 0, 0);
      return txnDate.getTime() === today.getTime();
    });
  };

  const getTodayExpense = () => {
    return getTodayTransactions()
      .filter(t => t.is_expense)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getTodayIncome = () => {
    return getTodayTransactions()
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getMonthlyExpense = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return recentTransactions
      .filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= monthStart && t.is_expense;
      })
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const renderStatCard = (title: string, value: string, emoji: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderAccountMiniCard = ({ item }: { item: Account }) => (
    <View style={styles.accountMini}>
      <View style={styles.accountMiniHeader}>
        <Text style={styles.accountMiniBankName}>{item.bank_name}</Text>
        <Text style={[styles.accountMiniStatus, { color: item.is_active ? '#34C759' : '#FF3B30' }]}>
          {item.is_active ? '●' : '○'}
        </Text>
      </View>
      <Text style={styles.accountMiniNumber}>•••• {item.account_number.slice(-4)}</Text>
      <Text style={styles.accountMiniBalance}>₹{item.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
    </View>
  );

  const renderRecentTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionRowLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.is_income ? '#34C75920' : '#FF3B3020' }
        ]}>
          <Text style={styles.transactionIconText}>
            {item.is_income ? '📥' : '📤'}
          </Text>
        </View>
        <View>
          <Text style={styles.transactionName}>{item.merchant || 'Transaction'}</Text>
          <Text style={styles.transactionTime}>
            {new Date(item.date).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.is_income ? '#34C759' : '#FF3B30' }
      ]}>
        {item.is_income ? '+' : '-'}₹{Math.abs(item.net_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Hello!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        })}</Text>
      </View>

      {/* Total Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceCardTop}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{getTotalBalance().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.balanceIcon}>
            <Text style={styles.balanceIconText}>💰</Text>
          </View>
        </View>
        <View style={styles.balanceCardBottom}>
          <Text style={styles.accountCount}>{accounts.length} accounts • {accounts.filter(a => a.is_active).length} active</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {renderStatCard('Today Expense', `₹${getTodayExpense().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📊', '#FFE5E5')}
        {renderStatCard('Today Income', `₹${getTodayIncome().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📈', '#E5F5E5')}
        {renderStatCard('This Month', `₹${getMonthlyExpense().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📅', '#E5E5FF')}
      </View>

      {/* Accounts Overview */}
      {accounts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={accounts.slice(0, 3)}
            renderItem={renderAccountMiniCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            style={styles.accountsList}
          />
        </View>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentTransactions.slice(0, 5)}
            renderItem={renderRecentTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📱</Text>
          <Text style={styles.emptyStateTitle}>Get Started</Text>
          <Text style={styles.emptyStateText}>
            Add accounts or sync from SMS to see your transactions here
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Tip: Sync your SMS to automatically detect transactions</Text>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIconText: {
    fontSize: 24,
  },
  balanceCardBottom: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  accountCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
    color: '#000',
  },
  sectionAction: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  accountsList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  accountMini: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: width * 0.4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  accountMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountMiniBankName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  accountMiniStatus: {
    fontSize: 12,
  },
  accountMiniNumber: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  accountMiniBalance: {
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
    backgroundColor: '#fff',
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
    color: '#000',
  },
  transactionTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    backgroundColor: '#E8F4FF',
    paddingVertical: 12,
    borderRadius: 8,
  },
});
