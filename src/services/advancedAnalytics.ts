/**
 * PHASE 4: Advanced Analytics Service
 * 
 * Provides detailed financial analytics and insights:
 * - Spending trends over time
 * - Category distribution analysis
 * - Income vs Expense tracking
 * - Year-over-year comparisons
 * - Monthly/Weekly patterns
 * - Savings rate calculation
 */

import { ParsedSMS } from './parser';

export interface TransactionAnalytics {
  id: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
  date: Date;
  merchant: string;
  account: string;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface CategoryStats {
  category: string;
  amount: number;
  transactionCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendData {
  date: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
}

export interface AnalyticsReport {
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  savingsRate: number;
  averageDailySpend: number;
  averageTransactionValue: number;
  topCategories: CategoryStats[];
  monthlyStats: MonthlyStats[];
  trends: TrendData[];
}

export class AdvancedAnalyticsService {
  /**
   * Calculate monthly statistics
   */
  static calculateMonthlyStats(transactions: TransactionAnalytics[]): MonthlyStats[] {
    const monthlyData: Record<string, Partial<MonthlyStats>> = {};

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
          transactionCount: 0,
        };
      }

      const month = monthlyData[monthKey];
      if (txn.type === 'credit') {
        month.income = (month.income || 0) + txn.amount;
      } else {
        month.expense = (month.expense || 0) + txn.amount;
      }
      month.transactionCount = (month.transactionCount || 0) + 1;
    });

    // Calculate net and convert to array
    return Object.values(monthlyData)
      .map((m) => ({
        month: m.month || '',
        income: m.income || 0,
        expense: m.expense || 0,
        net: (m.income || 0) - (m.expense || 0),
        transactionCount: m.transactionCount || 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Analyze category distribution
   */
  static analyzeCategoryDistribution(transactions: TransactionAnalytics[]): CategoryStats[] {
    const categoryData: Record<string, { amount: number; count: number }> = {};
    let totalAmount = 0;

    // Only analyze expense transactions
    transactions
      .filter((txn) => txn.type === 'debit')
      .forEach((txn) => {
        const category = txn.category || 'Other';

        if (!categoryData[category]) {
          categoryData[category] = { amount: 0, count: 0 };
        }

        categoryData[category].amount += txn.amount;
        categoryData[category].count += 1;
        totalAmount += txn.amount;
      });

    // Convert to array and sort by amount
    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        transactionCount: data.count,
        percentage:
          totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100 * 10) / 10 : 0,
        trend: this.calculateTrend(transactions, category),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate spending trend for a category
   */
  private static calculateTrend(
    transactions: TransactionAnalytics[],
    category: string
  ): 'up' | 'down' | 'stable' {
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const oldPeriod = transactions
      .filter(
        (txn) =>
          txn.category === category &&
          txn.type === 'debit' &&
          txn.date >= fourWeeksAgo &&
          txn.date < twoWeeksAgo
      )
      .reduce((sum, txn) => sum + txn.amount, 0);

    const newPeriod = transactions
      .filter(
        (txn) =>
          txn.category === category &&
          txn.type === 'debit' &&
          txn.date >= twoWeeksAgo &&
          txn.date <= now
      )
      .reduce((sum, txn) => sum + txn.amount, 0);

    if (newPeriod > oldPeriod * 1.1) return 'up';
    if (newPeriod < oldPeriod * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Get daily spending trend
   */
  static getDailyTrend(transactions: TransactionAnalytics[]): TrendData[] {
    const trendMap: Record<string, { amount: number; category: string; type: string }[]> = {};

    transactions.forEach((txn) => {
      const date = new Date(txn.date).toISOString().split('T')[0];

      if (!trendMap[date]) {
        trendMap[date] = [];
      }

      trendMap[date].push({
        amount: txn.amount,
        category: txn.category,
        type: txn.type,
      });
    });

    // Aggregate by date
    return Object.entries(trendMap)
      .map(([date, items]) => ({
        date,
        amount: items.reduce((sum, item) => (item.type === 'debit' ? sum + item.amount : sum), 0),
        category: items[0]?.category || 'Mixed',
        type: (items[0]?.type as 'debit' | 'credit') || 'debit',
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate comprehensive analytics report
   */
  static generateReport(
    transactions: TransactionAnalytics[],
    period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): AnalyticsReport {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filter transactions for period
    const periodTransactions = transactions.filter(
      (txn) => txn.date >= startDate && txn.date <= now
    );

    // Calculate totals
    const totalIncome = periodTransactions
      .filter((txn) => txn.type === 'credit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpense = periodTransactions
      .filter((txn) => txn.type === 'debit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const netIncome = totalIncome - totalExpense;

    // Calculate metrics
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const transactionCount = periodTransactions.length;

    return {
      period,
      startDate,
      endDate: now,
      totalIncome,
      totalExpense,
      netIncome,
      savingsRate: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
      averageDailySpend: Math.round(totalExpense / daysDiff),
      averageTransactionValue:
        transactionCount > 0 ? Math.round(totalExpense / transactionCount) : 0,
      topCategories: this.analyzeCategoryDistribution(periodTransactions).slice(0, 5),
      monthlyStats: this.calculateMonthlyStats(periodTransactions),
      trends: this.getDailyTrend(periodTransactions),
    };
  }

  /**
   * Calculate year-over-year comparison
   */
  static getYearOverYearComparison(
    currentYear: TransactionAnalytics[],
    previousYear: TransactionAnalytics[]
  ): {
    currentYearTotal: number;
    previousYearTotal: number;
    percentChange: number;
    trend: 'up' | 'down';
  } {
    const currentTotal = currentYear
      .filter((txn) => txn.type === 'debit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const previousTotal = previousYear
      .filter((txn) => txn.type === 'debit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const percentChange =
      previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      currentYearTotal: currentTotal,
      previousYearTotal: previousTotal,
      percentChange: Math.round(percentChange * 10) / 10,
      trend: percentChange > 0 ? 'up' : 'down',
    };
  }

  /**
   * Calculate budget health score (0-100)
   */
  static calculateHealthScore(report: AnalyticsReport): number {
    let score = 100;

    // Reduce for negative net income
    if (report.netIncome < 0) {
      score -= 20;
    }

    // Reduce for poor savings rate
    if (report.savingsRate < 0.1) {
      score -= 15;
    } else if (report.savingsRate < 0.2) {
      score -= 10;
    }

    // Reduce for high expense variance
    const monthlyExpenses = report.monthlyStats.map((m) => m.expense);
    const avgExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
    const variance =
      monthlyExpenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpense, 2), 0) /
      monthlyExpenses.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgExpense > 0 ? stdDev / avgExpense : 0;

    if (coefficientOfVariation > 0.5) {
      score -= 15;
    } else if (coefficientOfVariation > 0.3) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get spending insights
   */
  static getInsights(report: AnalyticsReport): string[] {
    const insights: string[] = [];

    // Income insights
    if (report.netIncome <= 0) {
      insights.push('⚠️ You\'re spending more than you earn. Focus on reducing expenses.');
    } else if (report.savingsRate > 0.3) {
      insights.push('🎉 Excellent! You\'re saving 30%+ of your income.');
    } else if (report.savingsRate > 0.2) {
      insights.push('👍 Good job! You\'re saving 20%+ of your income.');
    }

    // Top category insight
    if (report.topCategories.length > 0) {
      const topCat = report.topCategories[0];
      insights.push(`📊 ${topCat.category} is your top expense (${topCat.percentage}%)`);
    }

    // Trend insight
    const trendCategories = report.topCategories.filter((c) => c.trend === 'up');
    if (trendCategories.length > 0) {
      insights.push(
        `📈 Watch out: ${trendCategories[0].category} spending is trending up`
      );
    }

    // Daily spending insight
    if (report.averageDailySpend > 0) {
      insights.push(`💰 You spend ₹${report.averageDailySpend} per day on average`);
    }

    return insights;
  }
}
