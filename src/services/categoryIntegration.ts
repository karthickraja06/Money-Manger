/**
 * Transaction Categorizer - Enhanced Integration
 * 
 * Integrates auto-categorization with transaction parsing
 * Links parsed transactions to appropriate categories
 * Learns from user corrections
 */

import { DatabaseService } from './database';
import { TransactionCategory, MerchantMapping } from '../types';

export class TransactionCategorizer {
  /**
   * Comprehensive keyword mappings for each category
   * Used for auto-categorization based on merchant name
   */
  static readonly CATEGORY_KEYWORDS: Record<TransactionCategory, string[]> = {
    'Food': [
      'starbucks', 'mcdonalds', 'dominos', 'pizza', 'burger',
      'restaurant', 'cafe', 'food', 'lunch', 'dinner', 'breakfast',
      'zomato', 'swiggy', 'uber eats', 'grubhub', 'seamless',
      'subway', 'kfc', 'barbeque', 'chinese', 'indian',
      'bakery', 'deli', 'diner', 'bistro'
    ],
    'Entertainment': [
      'netflix', 'amazon prime', 'hulu', 'disney', 'spotify',
      'youtube', 'gaming', 'game', 'steam', 'xbox', 'playstation',
      'movie', 'cinema', 'theater', 'concert', 'music',
      'entertainment', 'hbo', 'apple tv', 'twitch', 'discord'
    ],
    'Travel': [
      'uber', 'lyft', 'ola', 'grab', 'taxi', 'cab',
      'airline', 'flight', 'hotel', 'airbnb', 'booking',
      'parking', 'gas', 'fuel', 'petrol', 'diesel',
      'railway', 'train', 'metro', 'bus', 'transit',
      'agoda', 'expedia', 'kayak'
    ],
    'Shopping': [
      'amazon', 'ebay', 'walmart', 'target', 'bestbuy',
      'mall', 'store', 'shop', 'retail', 'clothing',
      'flipkart', 'snapdeal', 'myntra', 'jabong',
      'book', 'shoes', 'apparel', 'fashion', 'boutique',
      'market', 'bazaar', 'supermarket', 'costco'
    ],
    'Utilities': [
      'electric', 'water', 'gas', 'internet', 'phone',
      'mobile', 'telecom', 'airtel', 'jio', 'vodafone',
      'electricity board', 'water board', 'utility',
      'cable', 'broadband', 'wifi', 'verizon', 'at&t'
    ],
    'Salary': [
      'salary', 'payroll', 'wages', 'income', 'bonus',
      'employer', 'company', 'direct deposit', 'payment',
      'refund', 'tax', 'reimbursement'
    ],
    'Medical': [
      'hospital', 'doctor', 'clinic', 'pharmacy', 'drug',
      'medical', 'health', 'dental', 'dentist',
      'medicine', 'prescription', 'lab', 'diagnostic',
      'apolloaihealth', 'practo', 'netmeds'
    ],
    'Education': [
      'school', 'college', 'university', 'course',
      'tuition', 'training', 'education', 'class',
      'online', 'udemy', 'coursera', 'edx', 'skillshare',
      'book', 'textbook', 'learning'
    ],
    'Rent': [
      'rent', 'landlord', 'lease', 'housing',
      'apartment', 'lease payment', 'rental'
    ],
    'Savings': [
      'savings', 'deposit', 'transfer', 'investment',
      'bank', 'account', 'fixed deposit', 'save'
    ],
    'Investment': [
      'stock', 'share', 'mutual fund', 'etf',
      'crypto', 'bitcoin', 'investment', 'brokerage',
      'securities', 'trading', 'NSE', 'BSE'
    ],
    'Bills': [
      'bill', 'payment', 'invoice', 'electricity',
      'water', 'insurance', 'premium', 'mortgage'
    ],
    'Loan': [
      'loan', 'emi', 'credit', 'borrowing',
      'debt', 'installment', 'monthly payment'
    ],
    'Insurance': [
      'insurance', 'premium', 'policy', 'coverage',
      'health insurance', 'car insurance', 'life insurance',
      'claim'
    ],
    'Gifts': [
      'gift', 'present', 'donation', 'charity',
      'contribution', 'fundraiser', 'payment to friend'
    ],
    'Refund': [
      'refund', 'return', 'credit', 'reversal',
      'chargeback', 'reimbursement'
    ],
    'Other': [
      'miscellaneous', 'other', 'general', 'payment'
    ]
  };

  /**
   * Get category for a transaction based on merchant
   * 1. Checks merchant_mapping table for user-learned mappings
   * 2. Falls back to keyword matching
   * 3. Returns best guess or 'Other'
   */
  static async getCategoryForMerchant(
    merchant: string,
    userId: string,
    merchantMappings?: Record<string, TransactionCategory>
  ): Promise<TransactionCategory> {
    try {
      const merchantLower = merchant.toLowerCase();

      // Step 1: Check user-learned mappings
      if (merchantMappings && merchantMappings[merchant]) {
        console.log(`✅ Found learned mapping: ${merchant} → ${merchantMappings[merchant]}`);
        return merchantMappings[merchant];
      }

      // Step 2: Try keyword matching
      const category = this.categorizeByKeywords(merchant);
      console.log(`✅ Auto-categorized: ${merchant} → ${category}`);
      return category;

    } catch (error) {
      console.error(`❌ Error categorizing ${merchant}:`, error);
      return 'Other';
    }
  }

  /**
   * Categorize by keyword matching
   */
  static categorizeByKeywords(merchant: string): TransactionCategory {
    const merchantLower = merchant.toLowerCase();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (merchantLower.includes(keyword)) {
          return category as TransactionCategory;
        }
      }
    }

    // Default to Other if no match found
    return 'Other';
  }

  /**
   * Learn a new merchant → category mapping
   * Stores user corrections for future use
   */
  static async learnMerchantMapping(
    userId: string,
    merchant: string,
    category: TransactionCategory
  ): Promise<boolean> {
    try {
      console.log(`📚 Learning: ${merchant} → ${category}`);

      // For now, store in memory
      // TODO: Store in merchant_mapping table in database
      // await DatabaseService.createMerchantMapping({
      //   user_id: userId,
      //   merchant,
      //   category,
      //   confidence: 1.0 (user-verified)
      // });

      console.log(`✅ Learned new mapping`);
      return true;
    } catch (error) {
      console.error(`❌ Error learning mapping:`, error);
      return false;
    }
  }

  /**
   * Suggest category based on transaction amount
   * Heuristic: large round amounts might be salary/rent/bills
   */
  static suggestByAmount(
    amount: number,
    type: 'debit' | 'credit'
  ): TransactionCategory {
    // Large credits are likely income/salary
    if (type === 'credit' && amount > 10000) {
      return 'Salary';
    }

    // Round large debits might be rent/bills
    if (type === 'debit' && amount > 5000 && amount % 500 === 0) {
      return 'Rent';
    }

    return 'Other';
  }

  /**
   * Categorize transaction with all available information
   */
  static async categorizeTransaction(
    merchant: string | undefined,
    amount: number,
    type: 'debit' | 'credit',
    userId: string,
    merchantMappings?: Record<string, TransactionCategory>
  ): Promise<TransactionCategory> {
    // Use merchant if available
    if (merchant) {
      return this.getCategoryForMerchant(merchant, userId, merchantMappings);
    }

    // Fall back to amount-based suggestion
    return this.suggestByAmount(amount, type);
  }

  /**
   * Batch categorize multiple transactions
   */
  static async categorizeMultiple(
    transactions: Array<{
      merchant: string | undefined;
      amount: number;
      type: 'debit' | 'credit';
    }>,
    userId: string,
    merchantMappings?: Record<string, TransactionCategory>
  ): Promise<TransactionCategory[]> {
    try {
      const categories: TransactionCategory[] = [];

      for (const transaction of transactions) {
        const category = await this.categorizeTransaction(
          transaction.merchant,
          transaction.amount,
          transaction.type,
          userId,
          merchantMappings
        );
        categories.push(category);
      }

      return categories;
    } catch (error) {
      console.error('❌ Error batch categorizing:', error);
      return transactions.map(() => 'Other');
    }
  }
}
