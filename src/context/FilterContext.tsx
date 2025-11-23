/**
 * PHASE 5: Filter Context & State Management
 * Manages all filtering state for transactions
 * 
 * Features:
 * - Date range filtering
 * - Transaction type filtering
 * - Account filtering
 * - Category filtering
 * - Tag filtering
 * - Merchant search
 * - Refund status filtering
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '../types';

export interface FilterState {
  // Date filters
  dateRangeType: 'today' | 'week' | 'month' | 'custom';
  customStartDate: Date | null;
  customEndDate: Date | null;

  // Transaction type filters
  transactionTypes: ('debit' | 'credit' | 'upi' | 'atm' | 'cash')[];

  // Account filters
  selectedAccounts: string[]; // account IDs

  // Category filters
  selectedCategories: string[];

  // Tag filters
  selectedTags: string[];

  // Merchant search
  merchantSearch: string;

  // Refund status
  refundStatus: 'all' | 'linked' | 'unlinked';

  // Search term for transactions
  searchTerm: string;
}

export interface FilterContextType {
  filters: FilterState;
  updateDateRange: (type: FilterState['dateRangeType'], start?: Date, end?: Date) => void;
  toggleTransactionType: (type: 'debit' | 'credit' | 'upi' | 'atm' | 'cash') => void;
  setTransactionTypes: (types: FilterState['transactionTypes']) => void;
  toggleAccount: (accountId: string) => void;
  setAccounts: (accountIds: string[]) => void;
  toggleCategory: (categoryId: string) => void;
  setCategories: (categoryIds: string[]) => void;
  toggleTag: (tag: string) => void;
  setTags: (tags: string[]) => void;
  setMerchantSearch: (search: string) => void;
  setRefundStatus: (status: FilterState['refundStatus']) => void;
  setSearchTerm: (term: string) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const DEFAULT_FILTERS: FilterState = {
  dateRangeType: 'month',
  customStartDate: null,
  customEndDate: null,
  transactionTypes: [],
  selectedAccounts: [],
  selectedCategories: [],
  selectedTags: [],
  merchantSearch: '',
  refundStatus: 'all',
  searchTerm: '',
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const updateDateRange = (type: FilterState['dateRangeType'], start?: Date, end?: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRangeType: type,
      customStartDate: start || null,
      customEndDate: end || null,
    }));
  };

  const toggleTransactionType = (type: 'debit' | 'credit' | 'upi' | 'atm' | 'cash') => {
    setFilters(prev => ({
      ...prev,
      transactionTypes: prev.transactionTypes.includes(type)
        ? prev.transactionTypes.filter(t => t !== type)
        : [...prev.transactionTypes, type],
    }));
  };

  const setTransactionTypes = (types: FilterState['transactionTypes']) => {
    setFilters(prev => ({ ...prev, transactionTypes: types }));
  };

  const toggleAccount = (accountId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAccounts: prev.selectedAccounts.includes(accountId)
        ? prev.selectedAccounts.filter(id => id !== accountId)
        : [...prev.selectedAccounts, accountId],
    }));
  };

  const setAccounts = (accountIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedAccounts: accountIds }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const setCategories = (categoryIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedCategories: categoryIds }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const setTags = (tags: string[]) => {
    setFilters(prev => ({ ...prev, selectedTags: tags }));
  };

  const setMerchantSearch = (search: string) => {
    setFilters(prev => ({ ...prev, merchantSearch: search }));
  };

  const setRefundStatus = (status: FilterState['refundStatus']) => {
    setFilters(prev => ({ ...prev, refundStatus: status }));
  };

  const setSearchTerm = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = () => {
    return (
      filters.dateRangeType !== 'month' ||
      filters.transactionTypes.length > 0 ||
      filters.selectedAccounts.length > 0 ||
      filters.selectedCategories.length > 0 ||
      filters.selectedTags.length > 0 ||
      filters.merchantSearch.length > 0 ||
      filters.refundStatus !== 'all' ||
      filters.searchTerm.length > 0
    );
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateDateRange,
        toggleTransactionType,
        setTransactionTypes,
        toggleAccount,
        setAccounts,
        toggleCategory,
        setCategories,
        toggleTag,
        setTags,
        setMerchantSearch,
        setRefundStatus,
        setSearchTerm,
        resetFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextType {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
}
