/**
 * PHASE 6: Trends Screen
 * Displays financial trends with charts and analytics
 * 
 * Features:
 * - Monthly expense vs income line chart
 * - Category-wise stacked bar chart
 * - Calendar heatmap for daily spending
 * - Merchant leaderboard
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/src/context/ThemeContext';
import { DatabaseService } from '@/src/services/database';
import { useStore } from '@/src/store/appStore';
import { Transaction } from '@/src/types';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export function TrendsScreen() {
  const { isDarkMode } = useTheme();
  const userId = useStore((state) => state.user?.id);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [merchantLeaderboard, setMerchantLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const loadTrendsData = async () => {
      try {
        setLoading(true);
        const txns = await DatabaseService.getTransactions(userId, 500, 0).then(
          (r) => r.data
        );
        setTransactions(txns);

        // Generate trends data
        const now = new Date();
const months: Array<{ month: string; income: number; expense: number }> = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            expense: 0,
          });
        }

        // Aggregate by month
        txns.forEach((txn) => {
          const txnDate = new Date(txn.date);
          const monthIndex = (txnDate.getMonth() - (now.getMonth() - 11)) % 12;
          if (monthIndex >= 0 && monthIndex < 12) {
            if (txn.is_income) {
              months[monthIndex].income += txn.amount;
            } else if (txn.is_expense) {
              months[monthIndex].expense += txn.amount;
            }
          }
        });

        setMonthlyData(months);

        // Calculate category breakdown
        const categoryMap: Record<string, number> = {};
        txns.forEach((txn) => {
          if (txn.is_expense) {
            categoryMap[txn.category_id] = (categoryMap[txn.category_id] || 0) + (txn.net_amount || txn.amount);
          }
        });

        setCategoryData(
          Object.entries(categoryMap)
            .map(([cat, amount]) => ({ category: cat, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
        );

        // Generate merchant leaderboard
        const merchantMap: Record<string, { count: number; amount: number }> = {};
        txns.forEach((txn) => {
          if (txn.merchant) {
            if (!merchantMap[txn.merchant]) {
              merchantMap[txn.merchant] = { count: 0, amount: 0 };
            }
            merchantMap[txn.merchant].count += 1;
            merchantMap[txn.merchant].amount += txn.net_amount || txn.amount;
          }
        });

        setMerchantLeaderboard(
          Object.entries(merchantMap)
            .map(([merchant, data]) => ({ merchant, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );
      } catch (error) {
        console.error('Failed to load trends data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendsData();
  }, [userId]);

  const renderMonthlyChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <ThemedText style={styles.chartTitle}>📊 Monthly Trends</ThemedText>
      {monthlyData.map((month, index) => (
        <View key={index} style={styles.monthRow}>
          <ThemedText style={styles.monthLabel}>{month.month}</ThemedText>
          <View style={styles.monthBars}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min((month.income / 50000) * 100, 100)}%`,
                  backgroundColor: '#34C759',
                },
              ]}
            />
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min((month.expense / 50000) * 100, 100)}%`,
                  backgroundColor: '#FF3B30',
                },
              ]}
            />
          </View>
          <View style={styles.monthValues}>
            <ThemedText style={{ color: '#34C759', fontSize: 12 }}>
              +₹{(month.income / 1000).toFixed(0)}k
            </ThemedText>
            <ThemedText style={{ color: '#FF3B30', fontSize: 12 }}>
              -₹{(month.expense / 1000).toFixed(0)}k
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCategoryChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <ThemedText style={styles.chartTitle}>🏷️ Top Categories</ThemedText>
      {categoryData.map((cat, index) => (
        <View key={index} style={styles.categoryRow}>
          <ThemedText style={styles.categoryName}>{cat.category}</ThemedText>
          <View style={styles.categoryProgress}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((cat.amount / (categoryData[0]?.amount || 1)) * 100, 100)}%`,
                  backgroundColor: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00B4D8'][index % 5],
                },
              ]}
            />
          </View>
          <ThemedText style={styles.categoryAmount}>₹{(cat.amount / 1000).toFixed(0)}k</ThemedText>
        </View>
      ))}
    </View>
  );

  const renderMerchantLeaderboard = () => (
    <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <ThemedText style={styles.chartTitle}>🏪 Merchant Leaderboard</ThemedText>
      {merchantLeaderboard.map((merchant, index) => (
        <View key={index} style={styles.leaderboardRow}>
          <ThemedText style={styles.leaderboardRank}>#{index + 1}</ThemedText>
          <View style={styles.leaderboardInfo}>
            <ThemedText style={styles.leaderboardName}>{merchant.merchant}</ThemedText>
            <ThemedText style={styles.leaderboardCount}>{merchant.count} visits</ThemedText>
          </View>
          <ThemedText style={styles.leaderboardAmount}>₹{(merchant.amount / 1000).toFixed(0)}k</ThemedText>
        </View>
      ))}
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
          <ThemedText style={styles.title}>Financial Trends</ThemedText>
          <View style={styles.timeRangeButtons}>
            {(['week', 'month', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeButton,
                  timeRange === range && styles.activeTimeButton,
                  { backgroundColor: timeRange === range ? '#007AFF' : (isDarkMode ? '#444' : '#ddd') },
                ]}
                onPress={() => setTimeRange(range)}
              >
                <ThemedText style={styles.timeButtonText}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderMonthlyChart()}
        {renderCategoryChart()}
        {renderMerchantLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTimeButton: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  monthLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '500',
  },
  monthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  monthValues: {
    width: 80,
    alignItems: 'flex-end',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryName: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryProgress: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  leaderboardRank: {
    width: 30,
    fontWeight: '700',
    fontSize: 14,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardCount: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  leaderboardAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
