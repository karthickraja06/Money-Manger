/**
 * Database Service
 * Handles all CRUD operations with Supabase
 */

import { supabase } from './supabase';
import { 
  Account, Transaction, Budget, Due, Category, MerchantMapping,
  ApiResponse, PaginatedResponse 
} from '../types';

export class DatabaseService {
  // ============ ACCOUNTS ============
  
  static async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createAccount(userId: string, account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        ...account,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateAccount(accountId: string, updates: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrCreateAccount(userId: string, bankName: string, accountNumber: string): Promise<Account> {
    // Try to get existing account
    const { data: existing } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('bank_name', bankName)
      .eq('account_number', accountNumber)
      .single();

    if (existing) return existing;

    // Create new account
    return this.createAccount(userId, {
      bank_name: bankName as any,
      account_number: accountNumber,
      balance: 0,
      created_from_sms: true,
      is_active: true,
    } as any);
  }

  // ============ TRANSACTIONS ============

  static async getTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<Transaction>> {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: (count || 0) > offset + limit,
    };
  }

  static async getTransactionById(transactionId: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createTransaction(
    userId: string,
    transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        ...transaction,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }

  // ============ CATEGORIES ============

  static async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async createCategory(userId: string, category: Omit<Category, 'id' | 'created_at' | 'user_id'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        ...category,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ BUDGETS ============

  static async getBudgets(userId: string, month?: number, year?: number): Promise<Budget[]> {
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (month !== undefined && year !== undefined) {
      query = query.eq('month', month).eq('year', year);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createBudget(userId: string, budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        ...budget,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ DUES ============

  static async getDues(userId: string): Promise<Due[]> {
    const { data, error } = await supabase
      .from('dues')
      .select('*')
      .eq('user_id', userId)
      .order('due_date');

    if (error) throw error;
    return data || [];
  }

  static async createDue(userId: string, due: Omit<Due, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Due> {
    const { data, error } = await supabase
      .from('dues')
      .insert({
        user_id: userId,
        ...due,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateDue(dueId: string, updates: Partial<Due>): Promise<Due> {
    const { data, error } = await supabase
      .from('dues')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ MERCHANT MAPPING ============

  static async getMerchantMappings(userId: string): Promise<MerchantMapping[]> {
    const { data, error } = await supabase
      .from('merchant_mapping')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async getMerchantMapping(userId: string, merchantName: string): Promise<MerchantMapping | null> {
    const { data, error } = await supabase
      .from('merchant_mapping')
      .select('*')
      .eq('user_id', userId)
      .eq('merchant_name', merchantName)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data || null;
  }

  static async createMerchantMapping(userId: string, mapping: Omit<MerchantMapping, 'id' | 'created_at' | 'user_id'>): Promise<MerchantMapping> {
    const { data, error } = await supabase
      .from('merchant_mapping')
      .insert({
        user_id: userId,
        ...mapping,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateMerchantMapping(mappingId: string, updates: Partial<MerchantMapping>): Promise<MerchantMapping> {
    const { data, error } = await supabase
      .from('merchant_mapping')
      .update({
        ...updates,
      })
      .eq('id', mappingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ REFUND LINKS ============

  static async getRefundLinksForExpense(expenseId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('refund_links')
      .select('*')
      .eq('expense_txn_id', expenseId);

    if (error) throw error;
    return data || [];
  }

  static async createRefundLink(
    userId: string,
    expenseId: string,
    refundId: string,
    amount: number
  ): Promise<any> {
    const { data, error } = await supabase
      .from('refund_links')
      .insert({
        user_id: userId,
        expense_txn_id: expenseId,
        refund_txn_id: refundId,
        amount_linked: amount,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRefundLink(refundLinkId: string): Promise<void> {
    const { error } = await supabase
      .from('refund_links')
      .delete()
      .eq('id', refundLinkId);

    if (error) throw error;
  }
}
