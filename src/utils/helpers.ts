/**
 * Utility Functions
 * Date formatting, currency formatting, filters, etc.
 */

import { Transaction, FilterOptions } from '../types';

// ============ DATE UTILITIES ============

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDateRange = (range: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } => {
  const today = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(today.getDate() - today.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  today.setHours(23, 59, 59, 999);
  return { start, end: today };
};

// ============ CURRENCY UTILITIES ============

export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency} ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseAmount = (text: string): number | null => {
  const match = text.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return null;
};

// ============ FILTER UTILITIES ============

export const applyFilters = (transactions: Transaction[], filters: FilterOptions): Transaction[] => {
  return transactions.filter((txn) => {
    // Date range filter
    if (filters.dateRange) {
      const txnDate = new Date(txn.date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (txnDate < startDate || txnDate > endDate) {
        return false;
      }
    }

    // Transaction type filter
    if (filters.transactionTypes && !filters.transactionTypes.includes(txn.type)) {
      return false;
    }

    // Account filter
    if (filters.accountIds && !filters.accountIds.includes(txn.account_id)) {
      return false;
    }

    // Category filter
    if (filters.categoryIds && txn.category_id && !filters.categoryIds.includes(txn.category_id)) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasTags = filters.tags.some((tag) => txn.tags.includes(tag));
      if (!hasTags) return false;
    }

    // Merchant search
    if (filters.merchantSearch) {
      if (!txn.merchant.toLowerCase().includes(filters.merchantSearch.toLowerCase())) {
        return false;
      }
    }

    // Refund status filter
    if (filters.refundStatus) {
      if (filters.refundStatus === 'linked' && !txn.is_linked) {
        return false;
      }
      if (filters.refundStatus === 'unlinked' && txn.is_linked) {
        return false;
      }
    }

    return true;
  });
};

// ============ CALCULATION UTILITIES ============

export const calculateStats = (transactions: Transaction[]) => {
  const debits = transactions.filter((t) => t.type === 'debit' || t.type === 'atm' || t.type === 'cash').reduce((sum, t) => sum + t.amount, 0);
  const credits = transactions.filter((t) => t.type === 'credit' || t.type === 'upi').reduce((sum, t) => sum + t.amount, 0);

  return {
    totalDebit: debits,
    totalCredit: credits,
    netAmount: credits - debits,
  };
};

export const getCurrentMonth = (): { month: number; year: number } => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

export const getPreviousMonth = (): { month: number; year: number } => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

// ============ VALIDATION UTILITIES ============

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// ============ MERCHANT NORMALIZATION ============

export const normalizeMerchantName = (merchant: string): string => {
  return merchant
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
