/**
 * Money Manager App - TypeScript Type Definitions
 * All data models and interfaces for the application
 */

// ============ AUTHENTICATION ============
export interface User {
  id: string;
  device_id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// ============ ACCOUNTS ============
export type BankName = 'HDFC' | 'ICICI' | 'SBI' | 'Indian Bank' | 'India Post' | 'Paytm' | 'PhonePe' | 'Cash' | 'Other';

export interface Account {
  id: string;
  user_id: string;
  bank_name: BankName;
  account_number: string;
  balance: number;
  created_from_sms: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ CATEGORIES ============
export type TransactionCategory = 
  | 'Food' | 'Entertainment' | 'Travel' | 'Shopping' | 'Utilities' | 'Salary'
  | 'Medical' | 'Education' | 'Rent' | 'Savings' | 'Investment' | 'Bills'
  | 'Loan' | 'Insurance' | 'Gifts' | 'Refund' | 'Other';

export interface Category {
  id: string;
  user_id: string;
  name: TransactionCategory;
  color: string;
  icon: string;
  created_at: string;
}

// ============ TRANSACTIONS ============
export type TransactionType = 'debit' | 'credit' | 'atm' | 'cash' | 'upi';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  category_id: string;
  tags: string[];
  date: string;
  is_income: boolean;
  is_expense: boolean;
  original_amount: number;
  net_amount: number;
  linked_to_expense_id?: string;
  is_linked: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============ REFUND LINKS ============
export interface RefundLink {
  id: string;
  user_id: string;
  expense_txn_id: string;
  refund_txn_id: string;
  amount_linked: number;
  created_at: string;
}

// ============ BUDGETS ============
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  thresholds: {
    warning_percent: number;
    critical_percent: number;
  };
  created_at: string;
  updated_at: string;
}

// ============ DUES & REMINDERS ============
export type DueStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
export type DueType = 'credit' | 'debit';

export interface Due {
  id: string;
  user_id: string;
  transaction_id?: string;
  contact_name: string;
  contact_phone?: string;
  amount: number;
  due_date: string;
  due_type: DueType;
  status: DueStatus;
  reminder_days_before: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============ MERCHANT MAPPING ============
export interface MerchantMapping {
  id: string;
  user_id: string;
  merchant_name: string;
  category_id: string;
  tags: string[];
  visit_count: number;
  last_assigned_at: string;
  created_at: string;
}

// ============ ANALYTICS & FILTERS ============
export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  transactionTypes?: TransactionType[];
  accountIds?: string[];
  categoryIds?: string[];
  tags?: string[];
  merchantSearch?: string;
  refundStatus?: 'linked' | 'unlinked';
}

export interface DashboardStats {
  currentMonthExpense: number;
  previousMonthIncome: number;
  recentTransactions: Transaction[];
  accountSummary: Array<{
    accountId: string;
    accountName: string;
    totalDebit: number;
    totalCredit: number;
  }>;
  categorySummary: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
  }>;
  budgetSummary: Array<{
    budgetId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentageUsed: number;
    status: 'on-track' | 'warning' | 'exceeded';
  }>;
}

export interface TrendData {
  monthlyExpenseVsIncome: Array<{
    month: string;
    expense: number;
    income: number;
  }>;
  categoryWiseSpend: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  merchantLeaderboard: Array<{
    merchant: string;
    visitCount: number;
    totalSpent: number;
  }>;
}

// ============ SMS PARSING ============
export interface SMSMessage {
  id: string;
  body: string;
  timestamp: string;
  sender: string;
  read: boolean;
}

export interface ParsedTransaction {
  bankName: BankName;
  amount: number;
  type: TransactionType;
  merchant?: string;
  accountNumber?: string;
  date: string;
  description: string;
  rawSMS: string;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
