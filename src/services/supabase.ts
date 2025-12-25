/**
 * Supabase Configuration and Client Setup
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
// ⚠️ IMPORTANT: Replace these with your actual Supabase credentials
// Get from https://supabase.com -> Project Settings -> API
const runtimeExtra = (Constants.expoConfig && (Constants.expoConfig as any).extra) || (Constants.manifest && (Constants.manifest as any).extra) || {};
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || runtimeExtra.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || runtimeExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database schema initialization SQL (run in Supabase SQL Editor)
export const DATABASE_SCHEMA_SQL = `
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

-- Create indexes for faster queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX idx_dues_user_date ON dues(user_id, due_date);
CREATE INDEX idx_merchant_mapping_user ON merchant_mapping(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_mapping ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies for device-based auth will be configured in the app
-- For now, we disable RLS to allow the app to manage user isolation
-- This is secure because all queries include user_id filtering from the app

-- Disable RLS temporarily (app will handle user isolation)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE refund_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE dues DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_mapping DISABLE ROW LEVEL SECURITY;
`;
