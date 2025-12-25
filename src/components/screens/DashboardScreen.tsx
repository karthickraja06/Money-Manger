import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useFilter } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { DatabaseService } from '../../services/database';
import { SMSService } from '../../services/sms';
import { SMSSyncManager, type SyncProgress } from '../../services/smsSyncManager';
import { useStore } from '../../store/appStore';
import { Account, Transaction } from '../../types';
import { FilterPresetsScreen } from './FilterPresetsScreen';
import { FilterScreen } from './FilterScreen';
import { FilteredResultsScreen } from './FilteredResultsScreen';
import { SearchScreen } from './SearchScreen';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { hasActiveFilters } = useFilter();
  const userId = useStore((state) => state.user?.id);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [smsSync, setSmsSync] = useState({ loading: false, progress: 0, message: '' });
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);
  const [permissionCheckDone, setPermissionCheckDone] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [presetsModalVisible, setPresetsModalVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
      checkSmsPermissionStatus();
    }
  }, [userId, selectedMonth]);

  const loadDashboardData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [accts, txns] = await Promise.all([
        DatabaseService.getAccounts(userId),
        DatabaseService.getTransactions(userId, 100, 0).then(r => r.data),
      ]);
      setAccounts(accts);
      setRecentTransactions(txns);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSmsPermissionStatus = async () => {
    try {
      // Check if SMS permission has been previously granted
      const granted = await SMSService.checkPermissionStatus();
      if (granted) {
        setSmsPermissionGranted(true);
        console.log('✅ SMS permission already granted');
      }
    } catch (error) {
      console.log('ℹ️ First time - SMS permission not yet requested');
    } finally {
      setPermissionCheckDone(true);
    }
  };

  const handleRequestSMSPermission = async () => {
    try {
      console.log('📱 Requesting SMS permission...');
      const granted = await SMSService.requestPermissions();
      
      if (granted) {
        setSmsPermissionGranted(true);
        Alert.alert(
          '✅ Success', 
          'SMS permission granted! You can now import all your SMS transactions.'
        );
      } else {
        Alert.alert(
          '⚠️ Permission Denied', 
          'SMS permission is required to read transactions. Please enable it in app settings.'
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to request SMS permission: ${error}`);
    }
  };

  const handleSyncSMS = async () => {
    if (!userId) return;
    
    setSyncModalVisible(true);
    setSmsSync({ loading: true, progress: 0, message: 'Starting sync...' });

    const unsubscribe = SMSSyncManager.onProgress((progress: SyncProgress) => {
      const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
      setSmsSync({
        loading: true,
        progress: percentage,
        message: progress.message,
      });
    });

    try {
      const result = await SMSSyncManager.performSync(userId);
      
      if (result.success) {
        setSmsSync({
          loading: false,
          progress: 100,
          message: `✅ Sync complete! ${result.smsRead} SMS read, ${result.transactionsStored} transactions added.`,
        });
        
        // Reload dashboard data
        await loadDashboardData();
        
        Alert.alert(
          '✅ Sync Successful',
          `SMS: ${result.smsRead}\nTransactions: ${result.transactionsStored}\nDuration: ${Math.round(result.duration / 1000)}s`
        );
      } else {
        setSmsSync({
          loading: false,
          progress: 0,
          message: `❌ Sync failed: ${result.errors.join(', ')}`,
        });
        
        Alert.alert(
          '❌ Sync Failed',
          result.errors.join('\n') || 'An error occurred during sync'
        );
      }
    } catch (error) {
      setSmsSync({
        loading: false,
        progress: 0,
        message: `❌ Error: ${error}`,
      });
      Alert.alert('❌ Error', `Sync error: ${error}`);
    } finally {
      unsubscribe();
      setTimeout(() => setSyncModalVisible(false), 2000);
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

  // Get transactions for SELECTED month (not current month)
  const getMonthTransactions = () => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    monthEnd.setTime(monthEnd.getTime() - 1);

    return recentTransactions.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= monthStart && txnDate <= monthEnd;
    });
  };

  const getMonthlyExpense = () => {
    return getMonthTransactions()
      .filter(t => t.is_expense)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getMonthlyIncome = () => {
    return getMonthTransactions()
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + t.net_amount, 0);
  };

  const getMonthlyNet = () => {
    return getMonthlyIncome() - getMonthlyExpense();
  };

  const previousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const renderStatCard = (title: string, value: string, emoji: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statTitle, { color: isDarkMode ? '#aaa' : '#666' }]}>{title}</Text>
      <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>{value}</Text>
    </View>
  );

  const renderAccountMiniCard = ({ item }: { item: Account }) => (
    <View style={[styles.accountMini, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderColor: isDarkMode ? '#444' : '#f0f0f0' }]}>
      <View style={styles.accountMiniHeader}>
        <Text style={[styles.accountMiniBankName, { color: isDarkMode ? '#fff' : '#000' }]}>{item.bank_name}</Text>
        <Text style={[styles.accountMiniStatus, { color: item.is_active ? '#34C759' : '#FF3B30' }]}>
          {item.is_active ? '●' : '○'}
        </Text>
      </View>
      <Text style={[styles.accountMiniNumber, { color: isDarkMode ? '#aaa' : '#999' }]}>•••• {item.account_number.slice(-4)}</Text>
      <Text style={styles.accountMiniBalance}>₹{item.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
    </View>
  );

  const renderRecentTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionRow, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
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
          <Text style={[styles.transactionName, { color: isDarkMode ? '#fff' : '#000' }]}>{item.merchant || 'Transaction'}</Text>
          <Text style={[styles.transactionTime, { color: isDarkMode ? '#aaa' : '#999' }]}>
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

  // Budget summary integrated in BudgetScreen

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderBottomColor: isDarkMode ? '#444' : '#eee' }]}>
          <View>
            <Text style={[styles.greeting, { color: isDarkMode ? '#fff' : '#000' }]}>👋 Hello!</Text>
            <Text style={[styles.date, { color: isDarkMode ? '#aaa' : '#999' }]}>{new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => setSearchModalVisible(true)}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setPresetsModalVisible(true)}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>⭐</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              style={[
                styles.headerButton,
                { backgroundColor: hasActiveFilters() ? '#007AFF' : (isDarkMode ? '#3a3a3a' : '#f0f0f0') }
              ]}
            >
              <Text style={[
                styles.headerButtonText,
                { color: hasActiveFilters() ? '#fff' : (isDarkMode ? '#aaa' : '#999') }
              ]}>
                {hasActiveFilters() ? '🔧' : '🔍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? '#0051BA' : '#007AFF' }]}>
          <View style={styles.balanceCardTop}>
            <View>
              <Text style={[styles.balanceLabel, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.8)' }]}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{getTotalBalance().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={[styles.balanceIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.balanceIconText}>💰</Text>
            </View>
          </View>
          <View style={[styles.balanceCardBottom, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }]}>
            <Text style={[styles.accountCount, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.8)' }]}>{accounts.length} accounts • {accounts.filter(a => a.is_active).length} active</Text>
          </View>
        </View>

        {/* SMS Import Section */}
        <View style={[styles.smsSection, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>📱 SMS Transactions</Text>
            {smsPermissionGranted && (
              <Text style={[styles.sectionAction, { color: isDarkMode ? '#64B5F6' : '#007AFF' }]}>✅ Permission Granted</Text>
            )}
          </View>
          <View style={styles.smsButtonsContainer}>
            {!smsPermissionGranted && permissionCheckDone && (
              <TouchableOpacity 
                style={[styles.smsButton, { flex: 1, marginRight: 8, backgroundColor: '#FF9500' }]}
                onPress={handleRequestSMSPermission}
              >
                <Text style={styles.smsButtonText}>🔐 Request Permission</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.smsButton, { flex: !smsPermissionGranted ? 1 : 2, backgroundColor: '#34C759' }]}
              onPress={handleSyncSMS}
              disabled={smsSync.loading}
            >
              <Text style={styles.smsButtonText}>
                {smsSync.loading ? '⏳ Syncing...' : '📨 Import SMS'}
              </Text>
            </TouchableOpacity>
          </View>
          {smsSync.loading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarSmall, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${smsSync.progress}%` }
                  ]} 
                />
              </View>
              <Text style={[{ color: isDarkMode ? '#aaa' : '#666' }]}>{smsSync.progress}% - {smsSync.message}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {renderStatCard('Today Expense', `₹${getTodayExpense().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📊', isDarkMode ? '#3d2020' : '#FFE5E5')}
          {renderStatCard('Today Income', `₹${getTodayIncome().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📈', isDarkMode ? '#203d20' : '#E5F5E5')}
          {renderStatCard('This Month', `₹${getMonthlyExpense().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '📅', isDarkMode ? '#1f1f3d' : '#E5E5FF')}
        </View>

        {/* Month Navigation */}
        <View style={[styles.monthNavigationContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', borderRadius: 12 }]}>
          <TouchableOpacity onPress={previousMonth} style={styles.monthNavButton}>
            <Text style={[styles.monthNavText, { color: isDarkMode ? '#64B5F6' : '#007AFF' }]}>‹ Prev</Text>
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Text style={[styles.monthText, { color: isDarkMode ? '#fff' : '#000' }]}>{formatMonth(selectedMonth)}</Text>
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={[styles.monthStatLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Income</Text>
                <Text style={[styles.monthStatValue, { color: '#34C759' }]}>
                  ₹{getMonthlyIncome().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={[styles.monthStatDivider, { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }]} />
              <View style={styles.monthStat}>
                <Text style={[styles.monthStatLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Expense</Text>
                <Text style={[styles.monthStatValue, { color: '#FF3B30' }]}>
                  ₹{getMonthlyExpense().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={[styles.monthStatDivider, { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }]} />
              <View style={styles.monthStat}>
                <Text style={[styles.monthStatLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Net</Text>
                <Text style={[styles.monthStatValue, { color: getMonthlyNet() >= 0 ? '#34C759' : '#FF3B30' }]}>
                  ₹{getMonthlyNet().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.monthNavButton}>
            <Text style={[styles.monthNavText, { color: isDarkMode ? '#64B5F6' : '#007AFF' }]}>Next ›</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts Overview */}
        {accounts.length > 0 && (
          <View style={[styles.section, { marginHorizontal: 16 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Your Accounts</Text>
              <TouchableOpacity>
                <Text style={[styles.sectionAction, { color: isDarkMode ? '#64B5F6' : '#007AFF' }]}>View All →</Text>
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

        {/* Transactions for Selected Month */}
        {getMonthTransactions().length > 0 ? (
          <View style={[styles.section, { marginHorizontal: 16 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                {formatMonth(selectedMonth)} Transactions
              </Text>
            </View>
            <FlatList
              data={getMonthTransactions()}
              renderItem={renderRecentTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={[styles.emptyStateTitle, { color: isDarkMode ? '#fff' : '#000' }]}>No Transactions</Text>
            <Text style={[styles.emptyStateText, { color: isDarkMode ? '#aaa' : '#999' }]}>
              No transactions in {formatMonth(selectedMonth)}. Sync SMS or add transactions manually.
            </Text>
          </View>
        )}

        {/* Budget Summary */}
        {/* Budget summary integrated in BudgetScreen */}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { backgroundColor: isDarkMode ? '#0051BA' : '#E8F4FF', color: isDarkMode ? '#64B5F6' : '#007AFF' }]}>💡 Tip: Use SMS Import to automatically detect bank transactions</Text>
        </View>
      </ScrollView>

      {/* Sync Progress Modal */}
      <Modal visible={syncModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Syncing SMS Transactions</Text>
            <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${smsSync.progress}%` }
                ]} 
              />
            </View>
            <Text style={[styles.modalMessage, { color: isDarkMode ? '#aaa' : '#666' }]}>{smsSync.message}</Text>
            <Text style={[styles.modalProgress, { color: isDarkMode ? '#fff' : '#000' }]}>{smsSync.progress}%</Text>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent={true} animationType="slide">
        <View style={[styles.filterModalContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
          <FilterScreen
            onClose={() => {
              setFilterModalVisible(false);
            }}
            onApply={() => {
              setFilterModalVisible(false);
              setShowFilteredResults(true);
            }}
          />
        </View>
      </Modal>

      {/* Filtered Results Modal */}
      <Modal visible={showFilteredResults} transparent={false} animationType="slide">
        <FilteredResultsScreen
          onOpenFilters={() => {
            setShowFilteredResults(false);
            setFilterModalVisible(true);
          }}
        />
      </Modal>

      {/* Search Modal */}
      <Modal visible={searchModalVisible} transparent={false} animationType="slide">
        <SearchScreen
          onClose={() => setSearchModalVisible(false)}
        />
      </Modal>

      {/* Filter Presets Modal */}
      <Modal visible={presetsModalVisible} transparent={false} animationType="slide">
        <FilterPresetsScreen
          onClose={() => setPresetsModalVisible(false)}
        />
      </Modal>
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  // SMS Section Styles
  smsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  smsButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  smsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  // Month Navigation Styles
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  monthNavButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  monthNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  monthDisplay: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  monthStat: {
    alignItems: 'center',
    flex: 1,
  },
  monthStatLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  monthStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 12,
  },
  modalMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  modalProgress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  // Header Buttons (Search, Presets, Filters)
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  // Filter Modal Container
  filterModalContainer: {
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#000',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  budgetUsage: {
    fontSize: 12,
    color: '#666',
  },
});

