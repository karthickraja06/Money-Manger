/**
 * Recurring Transactions Service
 * 
 * Detects and manages recurring payments
 * Features:
 * - Pattern detection (monthly, weekly, bi-weekly)
 * - Predict next occurrence
 * - Set reminders
 * - Track recurring expenses
 */

export interface RecurringPattern {
  merchant: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  lastDate: Date;
  nextDate: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  confidence: number; // 0-1, how confident we are this is recurring
  occurrences: number; // how many times we've seen this pattern
}

interface Transaction {
  merchant: string;
  amount: number;
  date: string;
}

export class RecurringTransactionService {
  /**
   * Detect recurring patterns from transaction history
   */
  static detectRecurringPatterns(
    transactions: Transaction[],
    minOccurrences: number = 3
  ): RecurringPattern[] {
    // Group transactions by merchant
    const merchantTransactions: Record<string, Transaction[]> = {};

    transactions.forEach(t => {
      if (!merchantTransactions[t.merchant]) {
        merchantTransactions[t.merchant] = [];
      }
      merchantTransactions[t.merchant].push(t);
    });

    const patterns: RecurringPattern[] = [];

    // Analyze each merchant's transactions
    for (const [merchant, txns] of Object.entries(merchantTransactions)) {
      // Sort by date
      const sorted = txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (sorted.length < minOccurrences) continue;

      // Check for consistent amounts
      const amounts = sorted.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b) / amounts.length;
      const amountVariance = amounts.every(a => Math.abs(a - avgAmount) < avgAmount * 0.1);

      if (!amountVariance) continue;

      // Detect frequency
      const frequency = this.detectFrequency(sorted);

      if (frequency) {
        const lastTxn = sorted[sorted.length - 1];
        const nextDate = this.calculateNextOccurrence(
          new Date(lastTxn.date),
          frequency
        );

        patterns.push({
          merchant,
          amount: avgAmount,
          frequency,
          lastDate: new Date(lastTxn.date),
          nextDate,
          confidence: this.calculateConfidence(sorted, frequency),
          occurrences: sorted.length,
        });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect frequency from transaction dates
   */
  private static detectFrequency(
    transactions: Transaction[]
  ): RecurringPattern['frequency'] | null {
    if (transactions.length < 2) return null;

    const dates = transactions.map(t => new Date(t.date).getTime());
    const intervals: number[] = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const daysInterval = avgInterval / (1000 * 60 * 60 * 24);

    // Determine frequency based on average interval
    if (daysInterval < 2) return 'daily';
    if (daysInterval < 5) return 'weekly'; // Allow some variance
    if (daysInterval < 10) return 'bi-weekly';
    if (daysInterval < 20) return 'monthly'; // Most common
    if (daysInterval < 100) return 'quarterly';
    if (daysInterval < 400) return 'yearly';

    return null;
  }

  /**
   * Calculate confidence score for recurring pattern
   */
  private static calculateConfidence(
    transactions: Transaction[],
    frequency: RecurringPattern['frequency']
  ): number {
    if (transactions.length < 3) return 0.3;
    if (transactions.length < 6) return 0.6;
    return 0.9; // High confidence with many occurrences
  }

  /**
   * Calculate next occurrence date
   */
  static calculateNextOccurrence(
    lastDate: Date,
    frequency: RecurringPattern['frequency']
  ): Date {
    const next = new Date(lastDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Get upcoming recurring payments
   */
  static getUpcomingPayments(
    patterns: RecurringPattern[],
    daysAhead: number = 30
  ): RecurringPattern[] {
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return patterns.filter(p => {
      return p.nextDate >= today && p.nextDate <= futureDate;
    });
  }

  /**
   * Get overdue recurring payments
   */
  static getOverduePayments(patterns: RecurringPattern[]): RecurringPattern[] {
    const today = new Date();
    return patterns.filter(p => p.nextDate < today);
  }

  /**
   * Get total monthly recurring expenses
   */
  static getTotalMonthlyRecurring(patterns: RecurringPattern[]): number {
    return patterns
      .filter(p => p.frequency !== 'irregular')
      .reduce((total, p) => {
        const monthlyAmount = this.getMonthlyEquivalent(p.amount, p.frequency);
        return total + monthlyAmount;
      }, 0);
  }

  /**
   * Convert frequency to monthly equivalent
   */
  private static getMonthlyEquivalent(amount: number, frequency: RecurringPattern['frequency']): number {
    switch (frequency) {
      case 'daily':
        return amount * 30;
      case 'weekly':
        return amount * 4.33;
      case 'bi-weekly':
        return amount * 2.17;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      case 'irregular':
        return 0;
    }
  }

  /**
   * Get frequency label
   */
  static getFrequencyLabel(frequency: RecurringPattern['frequency']): string {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-Weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'yearly':
        return 'Yearly';
      case 'irregular':
        return 'Irregular';
    }
  }

  /**
   * Get recurring patterns summary
   */
  static getSummary(patterns: RecurringPattern[]) {
    const totalMonthly = this.getTotalMonthlyRecurring(patterns);
    const upcoming = this.getUpcomingPayments(patterns, 7);
    const overdue = this.getOverduePayments(patterns);

    const byFrequency: Record<string, number> = {};
    patterns.forEach(p => {
      byFrequency[p.frequency] = (byFrequency[p.frequency] || 0) + 1;
    });

    return {
      totalPatterns: patterns.length,
      totalMonthlyAmount: totalMonthly,
      upcomingThisWeek: upcoming.length,
      overdueCount: overdue.length,
      byFrequency,
    };
  }

  /**
   * Format recurring pattern for display
   */
  static formatPattern(pattern: RecurringPattern): string {
    const frequency = this.getFrequencyLabel(pattern.frequency);
    const amount = `₹${pattern.amount.toLocaleString('en-IN')}`;
    const daysUntil = Math.ceil(
      (pattern.nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let status = '';
    if (daysUntil < 0) {
      status = `⚠️ Overdue by ${Math.abs(daysUntil)} days`;
    } else if (daysUntil === 0) {
      status = '🔔 Due today';
    } else if (daysUntil <= 7) {
      status = `📅 Due in ${daysUntil} days`;
    } else {
      status = `📅 Due ${pattern.nextDate.toLocaleDateString('en-IN')}`;
    }

    return `${pattern.merchant} - ${amount} (${frequency}) - ${status}`;
  }

  /**
   * Check if transaction matches a recurring pattern
   */
  static matchesPattern(
    transaction: Transaction,
    pattern: RecurringPattern,
    tolerance: number = 0.1
  ): boolean {
    // Check merchant
    if (transaction.merchant.toLowerCase() !== pattern.merchant.toLowerCase()) {
      return false;
    }

    // Check amount (within 10% by default)
    const diff = Math.abs(transaction.amount - pattern.amount);
    if (diff > pattern.amount * tolerance) {
      return false;
    }

    return true;
  }
}
