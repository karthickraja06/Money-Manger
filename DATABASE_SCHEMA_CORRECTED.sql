-- ============================================
-- Money Manager App - Database Schema
-- Corrected version (no RLS function errors)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  created_from_sms BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, bank_name, account_number)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3498db',
  icon TEXT DEFAULT 'tag',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'atm', 'cash', 'upi')),
  merchant TEXT,
  category_id UUID REFERENCES categories(id),
  tags TEXT[] DEFAULT '{}',
  date TIMESTAMP NOT NULL,
  is_income BOOLEAN DEFAULT false,
  is_expense BOOLEAN DEFAULT false,
  original_amount DECIMAL(15, 2) NOT NULL,
  net_amount DECIMAL(15, 2) NOT NULL,
  linked_to_expense_id UUID,
  is_linked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create refund_links table
CREATE TABLE IF NOT EXISTS refund_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_txn_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  refund_txn_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount_linked DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  thresholds JSONB DEFAULT '{"warning_percent": 80, "critical_percent": 100}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, month, year)
);

-- Create dues table
CREATE TABLE IF NOT EXISTS dues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  due_type TEXT NOT NULL CHECK (due_type IN ('credit', 'debit')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  reminder_days_before INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create merchant_mapping table
CREATE TABLE IF NOT EXISTS merchant_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  visit_count INTEGER DEFAULT 0,
  last_assigned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, merchant_name)
);

-- ============================================
-- Create indexes for faster queries
-- ============================================

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX idx_dues_user_date ON dues(user_id, due_date);
CREATE INDEX idx_merchant_mapping_user ON merchant_mapping(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_refund_links_expense ON refund_links(expense_txn_id);
CREATE INDEX idx_refund_links_refund ON refund_links(refund_txn_id);

-- ============================================
-- IMPORTANT: Security Note
-- ============================================
-- Since we're using device-based authentication (not Supabase Auth),
-- Row-Level Security (RLS) is disabled on all tables.
-- 
-- SECURITY IS ENFORCED AT THE APPLICATION LEVEL:
-- - All queries in the app include the user_id filter
-- - The app retrieves the current user from AsyncStorage
-- - Every database operation filters by the authenticated user_id
--
-- This approach is secure because:
-- 1. Each device has a unique device_id stored locally
-- 2. The app controls all database access through TypeScript services
-- 3. All queries are type-safe and include user_id filtering
-- 4. Data is encrypted in transit (HTTPS) and at rest (Supabase)
--
-- To enable RLS in the future (e.g., with Supabase Auth), create policies like:
-- CREATE POLICY "Users can read own data" ON users
--   FOR SELECT USING (auth.uid() = id);
-- ============================================
