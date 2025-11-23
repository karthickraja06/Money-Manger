/**
 * PHASE 4: Advanced Analytics Screen
 * Comprehensive financial analytics with charts and insights
 * 
 * Features:
 * - Spending trends (line chart)
 * - Category distribution (pie chart)
 * - Monthly comparison (bar chart)
 * - Key metrics and KPIs
 * - Financial insights
 * - Year-over-year comparison
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AdvancedAnalyticsService, AnalyticsReport, CategoryStats, MonthlyStats } from '../../services/advancedAnalytics';

const { width } = Dimensions.get('window');

export function AdvancedAnalyticsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Mock transaction data for demonstration
      const mockTransactions = generateMockTransactions();
      const analyticsReport = AdvancedAnalyticsService.generateReport(mockTransactions as any, period);
      setReport(analyticsReport);
      
      const generatedInsights = AdvancedAnalyticsService.getInsights(analyticsReport);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const healthScore = AdvancedAnalyticsService.calculateHealthScore(report);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>📈 Analytics</Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodButton,
                  period === p && { backgroundColor: colors.primary },
                  {
                    backgroundColor: period === p ? colors.primary : colors.backgroundAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: period === p ? colors.background : colors.text },
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Score Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>💪 Financial Health</Text>
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(healthScore) }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(healthScore) }]}>
                {healthScore}
              </Text>
            </View>
            <Text style={[styles.scoreLabel, { color: colors.textLight }]}>
              {getScoreLabel(healthScore)}
            </Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Key Metrics</Text>

          <MetricRow
            label="Total Income"
            value={`₹${report.totalIncome.toLocaleString()}`}
            icon="💰"
            colors={colors}
          />
          <MetricRow
            label="Total Expense"
            value={`₹${report.totalExpense.toLocaleString()}`}
            icon="💸"
            colors={colors}
          />
          <MetricRow
            label="Net Income"
            value={`₹${report.netIncome.toLocaleString()}`}
            icon={report.netIncome >= 0 ? '📈' : '📉'}
            colors={colors}
            highlight={report.netIncome >= 0}
          />
          <MetricRow
            label="Savings Rate"
            value={`${report.savingsRate.toFixed(1)}%`}
            icon="🏦"
            colors={colors}
          />
          <MetricRow
            label="Avg Daily Spend"
            value={`₹${report.averageDailySpend}`}
            icon="📅"
            colors={colors}
          />
        </View>

        {/* Top Categories */}
        <View style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🏷️ Top Categories</Text>

          {report.topCategories.map((cat, idx) => (
            <CategoryBar key={idx} category={cat} colors={colors} />
          ))}
        </View>

        {/* Monthly Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📅 Monthly Breakdown</Text>

          {report.monthlyStats.slice(-3).map((month, idx) => (
            <MonthlyRow key={idx} month={month} colors={colors} />
          ))}
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>💡 Insights</Text>
            {insights.map((insight, idx) => (
              <View key={idx} style={styles.insightRow}>
                <Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  icon: string;
  colors: any;
  highlight?: boolean;
}

function MetricRow({ label, value, icon, colors, highlight }: MetricRowProps) {
  return (
    <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
      <View style={styles.metricLabel}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={[styles.metricLabelText, { color: colors.textLight }]}>{label}</Text>
      </View>
      <Text
        style={[
          styles.metricValue,
          {
            color: highlight ? colors.success : colors.text,
            fontWeight: highlight ? '700' : '600',
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

interface CategoryBarProps {
  category: CategoryStats;
  colors: any;
}

function CategoryBar({ category, colors }: CategoryBarProps) {
  const maxAmount = 1000; // Mock max for bar width
  const barWidth = (category.amount / maxAmount) * 100;

  const trendIcon =
    category.trend === 'up' ? '📈' : category.trend === 'down' ? '📉' : '➡️';

  return (
    <View style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
      <View style={styles.categoryLabel}>
        <Text style={styles.categoryName}>{category.category}</Text>
        <Text style={[styles.categoryPercent, { color: colors.textLight }]}>
          {category.percentage}%
        </Text>
      </View>
      <View style={styles.categoryBar}>
        <View
          style={[
            styles.categoryBarFill,
            {
              width: `${Math.max(barWidth, 5)}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text style={styles.categoryTrend}>{trendIcon}</Text>
    </View>
  );
}

interface MonthlyRowProps {
  month: MonthlyStats;
  colors: any;
}

function MonthlyRow({ month, colors }: MonthlyRowProps) {
  const netColor = month.net >= 0 ? colors.success : colors.error;

  return (
    <View style={[styles.monthRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.monthLabel, { color: colors.text }]}>{month.month}</Text>
      <View style={styles.monthStats}>
        <View style={styles.monthStat}>
          <Text style={[styles.monthStatLabel, { color: colors.textLight }]}>Income</Text>
          <Text style={[styles.monthStatValue, { color: colors.success }]}>
            ₹{month.income.toLocaleString()}
          </Text>
        </View>
        <View style={styles.monthStat}>
          <Text style={[styles.monthStatLabel, { color: colors.textLight }]}>Expense</Text>
          <Text style={[styles.monthStatValue, { color: colors.error }]}>
            ₹{month.expense.toLocaleString()}
          </Text>
        </View>
        <View style={styles.monthStat}>
          <Text style={[styles.monthStatLabel, { color: colors.textLight }]}>Net</Text>
          <Text style={[styles.monthStatValue, { color: netColor }]}>
            ₹{month.net.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Helper Functions
function getScoreColor(score: number): string {
  if (score >= 80) return '#27AE60'; // Green
  if (score >= 60) return '#F39C12'; // Orange
  return '#E74C3C'; // Red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

function generateMockTransactions() {
  const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities'];
  const merchants = ['Amazon', 'Flipkart', 'Starbucks', 'Uber', 'Netflix'];
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const date = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const isIncome = Math.random() < 0.15;
    const amount = isIncome ? 50000 + Math.random() * 50000 : 100 + Math.random() * 2000;

    transactions.push({
      id: `mock_${i}`,
      amount: Math.round(amount),
      category: isIncome ? 'Income' : categories[Math.floor(Math.random() * categories.length)],
      type: isIncome ? 'credit' : 'debit',
      date,
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      account: 'Default Account',
    });
  }

  return transactions;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  metricLabelText: {
    fontSize: 13,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryLabel: {
    width: 120,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPercent: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
  },
  categoryTrend: {
    fontSize: 16,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 60,
  },
  monthStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  monthStatValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
