/**
 * Global State Management using Zustand
 * Manages all app state including user, transactions, budgets, etc.
 */

import { create } from 'zustand';
import { User, Transaction, Account, Budget, Due, Category, FilterOptions, DashboardStats } from '../types';

interface StoreState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Accounts
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;

  // Budgets
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;

  // Dues
  dues: Due[];
  setDues: (dues: Due[]) => void;
  addDue: (due: Due) => void;
  updateDue: (id: string, due: Partial<Due>) => void;

  // Filters
  activeFilters: FilterOptions;
  setActiveFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;

  // Dashboard stats
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats | null) => void;

  // Loading and error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Transactions
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  // Accounts
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),
  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),

  // Budgets
  budgets: [],
  setBudgets: (budgets) => set({ budgets }),
  addBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),
  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  // Dues
  dues: [],
  setDues: (dues) => set({ dues }),
  addDue: (due) =>
    set((state) => ({ dues: [...state.dues, due] })),
  updateDue: (id, updates) =>
    set((state) => ({
      dues: state.dues.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  // Filters
  activeFilters: {},
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  clearFilters: () => set({ activeFilters: {} }),

  // Dashboard
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // Loading and error
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
