/**
 * Screen Exports Index
 * Central export point for all screens in the Money Manager app
 * 
 * Usage:
 * import { DashboardScreen, AccountsScreen, ... } from '@/src/components/screens';
 */

export { DashboardScreen } from './DashboardScreen';
export { SyncStatusScreen } from './SyncStatusScreen';
export { TransactionListScreen } from './TransactionListScreen';
export { TransactionsScreen } from './TransactionsScreen';
export { AccountsScreen } from './AccountsScreen';
export { AnalyticsScreen } from './AnalyticsScreen';
export { CategoriesScreen } from './CategoriesScreen';
export { SettingsScreen } from './SettingsScreen';
export { AdvancedSearchScreen } from './AdvancedSearchScreen';
export { ExportScreen } from './ExportScreen';
export { BudgetScreen } from './BudgetScreen';

/**
 * Screen Configuration Map
 * Useful for dynamic navigation and route configuration
 */
export const SCREEN_CONFIG = {
  Dashboard: {
    name: 'Dashboard',
    icon: '📊',
    title: 'Overview',
  },
  Accounts: {
    name: 'Accounts',
    icon: '🏦',
    title: 'My Accounts',
  },
  Transactions: {
    name: 'Transactions',
    icon: '📝',
    title: 'Transactions',
  },
  Analytics: {
    name: 'Analytics',
    icon: '📈',
    title: 'Analytics',
  },
  Categories: {
    name: 'Categories',
    icon: '🏷️',
    title: 'Categories',
  },
  Sync: {
    name: 'Sync',
    icon: '📱',
    title: 'SMS Sync',
  },
  Settings: {
    name: 'Settings',
    icon: '⚙️',
    title: 'Settings',
  },
} as const;

/**
 * Screen List
 * Array of all available screens
 */
export const SCREEN_LIST = Object.values(SCREEN_CONFIG);

/**
 * Default Screen
 * The screen to show on app launch
 */
export const DEFAULT_SCREEN = 'Dashboard';
