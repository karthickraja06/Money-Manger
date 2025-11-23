/**
 * PHASE 5: Filter Engine Service
 * Applies filters to transactions and calculates statistics
 * 
 * Features:
 * - Multi-filter application
 * - Real-time statistics
 * - Category breakdown
 * - Merchant analysis
 */

import { Transaction } from '../types';
import { FilterState } from '../context/FilterContext';

export interface FilterStats {
  totalTransactions: number;
  totalDebit: number;
  totalCredit: number;
  totalNet: number;
  debitCount: number;
  creditCount: number;
  byCategory: Record<string, { count: number; amount: number; icon: string }>;
  byMerchant: Array<{ merchant: string; count: number; amount: number }>;
  byAccount: Record<string, { count: number; debit: number; credit: number }>;
}

export class FilterService {
  /**
   * Get date range based on filter type
   */
  static getDateRange(
    filterType: FilterState['dateRangeType'],
    customStart?: Date,
    customEnd?: Date
  ): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (filterType) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        return {
          start: customStart || new Date(),
          end: customEnd || new Date(),
        };
    }

    return { start, end };
  }

  /**
   * Apply all filters to transactions
   */
  static filterTransactions(
    transactions: Transaction[],
    filters: FilterState,
    allAccounts: any[] = [],
    allCategories: Record<string, any> = {}
  ): Transaction[] {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateRangeType) {
      const { start, end } = this.getDateRange(
        filters.dateRangeType,
        filters.customStartDate || undefined,
        filters.customEndDate || undefined
      );

      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= start && txnDate <= end;
      });
    }

    // Transaction type filter
    if (filters.transactionTypes.length > 0) {
      filtered = filtered.filter(txn => {
        if (filters.transactionTypes.includes('debit')) {
          if (txn.is_expense) return true;
        }
        if (filters.transactionTypes.includes('credit')) {
          if (txn.is_income) return true;
        }
        if (filters.transactionTypes.includes('upi')) {
          if (txn.type === 'upi') return true;
        }
        if (filters.transactionTypes.includes('atm')) {
          if (txn.type === 'atm') return true;
        }
        if (filters.transactionTypes.includes('cash')) {
          if (txn.type === 'cash') return true;
        }
        return false;
      });
    }

    // Account filter
    if (filters.selectedAccounts.length > 0) {
      filtered = filtered.filter(txn =>
        filters.selectedAccounts.includes(txn.account_id)
      );
    }

    // Category filter
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(txn =>
        filters.selectedCategories.includes(txn.category_id)
      );
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(txn => {
        const txnTags = txn.tags || [];
        return filters.selectedTags.some(tag => txnTags.includes(tag));
      });
    }

    // Merchant search filter
    if (filters.merchantSearch.trim()) {
      const search = filters.merchantSearch.toLowerCase();
      filtered = filtered.filter(txn =>
        (txn.merchant || '').toLowerCase().includes(search)
      );
    }

    // Search term filter (searches merchant and notes)
    if (filters.searchTerm.trim()) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(txn => {
        const merchant = (txn.merchant || '').toLowerCase();
        const notes = (txn.notes || '').toLowerCase();
        return merchant.includes(search) || notes.includes(search);
      });
    }

    return filtered;
  }

  /**
   * Calculate statistics for filtered transactions
   */
  static calculateStats(
    transactions: Transaction[],
    allAccounts: any[] = [],
    categoryIcons: Record<string, string> = {}
  ): FilterStats {
    const stats: FilterStats = {
      totalTransactions: transactions.length,
      totalDebit: 0,
      totalCredit: 0,
      totalNet: 0,
      debitCount: 0,
      creditCount: 0,
      byCategory: {},
      byMerchant: [],
      byAccount: {},
    };

    // Initialize account stats
    allAccounts.forEach(account => {
      stats.byAccount[account.id] = { count: 0, debit: 0, credit: 0 };
    });

    // Process each transaction
    transactions.forEach(txn => {
      const amount = txn.net_amount || txn.amount;

      if (txn.is_expense) {
        stats.totalDebit += amount;
        stats.debitCount += 1;
      } else if (txn.is_income) {
        stats.totalCredit += amount;
        stats.creditCount += 1;
      }

      // Category breakdown
      if (!stats.byCategory[txn.category_id]) {
        stats.byCategory[txn.category_id] = {
          count: 0,
          amount: 0,
          icon: categoryIcons[txn.category_id] || '📁',
        };
      }
      stats.byCategory[txn.category_id].count += 1;
      stats.byCategory[txn.category_id].amount += amount;

      // Merchant breakdown
      if (txn.merchant) {
        const existingMerchant = stats.byMerchant.find(
          m => m.merchant === txn.merchant
        );
        if (existingMerchant) {
          existingMerchant.count += 1;
          existingMerchant.amount += amount;
        } else {
          stats.byMerchant.push({
            merchant: txn.merchant,
            count: 1,
            amount: amount,
          });
        }
      }

      // Account breakdown
      if (stats.byAccount[txn.account_id]) {
        stats.byAccount[txn.account_id].count += 1;
        if (txn.is_expense) {
          stats.byAccount[txn.account_id].debit += amount;
        } else {
          stats.byAccount[txn.account_id].credit += amount;
        }
      }
    });

    // Calculate net
    stats.totalNet = stats.totalCredit - stats.totalDebit;

    // Sort merchants by amount (descending)
    stats.byMerchant.sort((a, b) => b.amount - a.amount);

    return stats;
  }

  /**
   * Get category data for display
   */
  static getCategoryData(stats: FilterStats) {
    return Object.entries(stats.byCategory).map(([category, data]) => ({
      name: category,
      value: data.amount,
      count: data.count,
      icon: data.icon,
    }));
  }

  /**
   * Get top merchants
   */
  static getTopMerchants(stats: FilterStats, limit: number = 5) {
    return stats.byMerchant.slice(0, limit);
  }
}
