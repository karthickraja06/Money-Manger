/**
 * App Constants
 * Configuration, categories, transaction types, etc.
 */

// ============ APP CONFIG ============

export const APP_CONFIG = {
  appName: 'Money Manager',
  version: '1.0.0',
  supportEmail: 'support@moneymanager.com',
};

// ============ TRANSACTION TYPES ============

export const TRANSACTION_TYPES = {
  DEBIT: 'debit' as const,
  CREDIT: 'credit' as const,
  ATM: 'atm' as const,
  CASH: 'cash' as const,
  UPI: 'upi' as const,
};

export const TRANSACTION_TYPE_LABELS = {
  debit: 'Debit',
  credit: 'Credit',
  atm: 'ATM Withdrawal',
  cash: 'Cash',
  upi: 'UPI Transfer',
};

// ============ CATEGORIES ============

export const CATEGORIES = [
  'Food',
  'Entertainment',
  'Travel',
  'Shopping',
  'Utilities',
  'Salary',
  'Medical',
  'Education',
  'Rent',
  'Savings',
  'Investment',
  'Bills',
  'Loan',
  'Insurance',
  'Gifts',
  'Refund',
  'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B',
  Entertainment: '#4ECDC4',
  Travel: '#45B7D1',
  Shopping: '#FFA07A',
  Utilities: '#98D8C8',
  Salary: '#6BCF7F',
  Medical: '#FF8C00',
  Education: '#9D84B7',
  Rent: '#C8B6FF',
  Savings: '#2ECC71',
  Investment: '#3498DB',
  Bills: '#E74C3C',
  Loan: '#34495E',
  Insurance: '#F39C12',
  Gifts: '#E91E63',
  Refund: '#27AE60',
  Other: '#95A5A6',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: 'utensils',
  Entertainment: 'film',
  Travel: 'plane',
  Shopping: 'shopping-bag',
  Utilities: 'plug',
  Salary: 'briefcase',
  Medical: 'heart',
  Education: 'book',
  Rent: 'home',
  Savings: 'piggy-bank',
  Investment: 'trending-up',
  Bills: 'receipt',
  Loan: 'credit-card',
  Insurance: 'shield',
  Gifts: 'gift',
  Refund: 'undo',
  Other: 'circle',
};

// ============ BANKS & ACCOUNTS ============

export const BANKS = [
  'HDFC',
  'ICICI',
  'SBI',
  'Indian Bank',
  'India Post',
  'Paytm',
  'PhonePe',
  'Cash',
  'Other',
];

export const BANK_COLORS: Record<string, string> = {
  HDFC: '#003DA5',
  ICICI: '#EC1C24',
  SBI: '#1F4788',
  'Indian Bank': '#007B3F',
  'India Post': '#004687',
  Paytm: '#0076FF',
  PhonePe: '#5F1AF0',
  Cash: '#27AE60',
  Other: '#95A5A6',
};

// ============ DUE STATUS ============

export const DUE_STATUS = {
  PENDING: 'pending' as const,
  COMPLETED: 'completed' as const,
  OVERDUE: 'overdue' as const,
  CANCELLED: 'cancelled' as const,
};

export const DUE_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const DUE_STATUS_COLORS = {
  pending: '#F39C12',
  completed: '#27AE60',
  overdue: '#E74C3C',
  cancelled: '#95A5A6',
};

// ============ FILTER OPTIONS ============

export const FILTER_PRESETS = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  CUSTOM_RANGE: 'custom_range',
};

// ============ BUDGET THRESHOLDS ============

export const BUDGET_THRESHOLDS = {
  WARNING: 80,  // 80% - Show warning
  CRITICAL: 100, // 100% - Budget exceeded
};

export const BUDGET_STATUS_COLORS = {
  'on-track': '#27AE60',
  'warning': '#F39C12',
  'exceeded': '#E74C3C',
};

// ============ NOTIFICATION MESSAGES ============

export const MESSAGES = {
  // Success
  SUCCESS_CREATE_ACCOUNT: 'Account created successfully',
  SUCCESS_CREATE_TRANSACTION: 'Transaction added successfully',
  SUCCESS_UPDATE_TRANSACTION: 'Transaction updated successfully',
  SUCCESS_DELETE_TRANSACTION: 'Transaction deleted successfully',
  SUCCESS_CREATE_BUDGET: 'Budget created successfully',
  SUCCESS_LINK_REFUND: 'Refund linked successfully',

  // Errors
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_DATABASE: 'Database error. Please try again.',
  ERROR_INVALID_AMOUNT: 'Please enter a valid amount',
  ERROR_INVALID_DATE: 'Please select a valid date',

  // Warnings
  WARNING_BUDGET_EXCEEDED: 'Budget exceeded for this category',
  WARNING_BUDGET_WARNING: 'You have reached 80% of your budget',

  // Info
  INFO_NO_TRANSACTIONS: 'No transactions found',
  INFO_NO_ACCOUNTS: 'No accounts found',
};

// ============ DATE FORMATS ============

export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy',
  TIME: 'hh:mm a',
  DATE_TIME: 'MMM dd, yyyy hh:mm a',
};

// ============ CURRENCY ============

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
};

// ============ PAGINATION ============

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  SMALL_PAGE_SIZE: 10,
  LARGE_PAGE_SIZE: 100,
};

// ============ STORAGE KEYS ============

export const STORAGE_KEYS = {
  USER: 'money_manager_user',
  DEVICE_ID: 'money_manager_device_id',
  THEME: 'money_manager_theme',
  NOTIFICATIONS_ENABLED: 'money_manager_notifications',
  SMS_CONSENT: 'money_manager_sms_consent',
};
