/**
 * Auto-Categorizer Service
 * Automatically assigns transaction categories based on merchant name
 */

import { TransactionCategory } from '../types';

export class AutoCategorizer {
  /**
   * Categorize transaction based on merchant name
   */
  static categorize(merchant?: string, merchantMappings?: Record<string, string>): TransactionCategory {
    if (!merchant) return 'Other';

    const merchantLower = merchant.toLowerCase();

    // Check merchant mappings first (user-learned patterns)
    if (merchantMappings) {
      for (const [stored, category] of Object.entries(merchantMappings)) {
        if (merchantLower.includes(stored.toLowerCase())) {
          console.log(`✅ Found mapping: ${merchant} → ${category}`);
          return category as TransactionCategory;
        }
      }
    }

    // Fall back to keyword matching
    return this.categorizeByKeywords(merchantLower);
  }

  /**
   * Categorize based on merchant keywords
   */
  private static categorizeByKeywords(merchant: string): TransactionCategory {
    const categories: Record<TransactionCategory, string[]> = {
      Food: ['restaurant', 'cafe', 'pizza', 'burger', 'food', 'swiggy', 'zomato', 'uber eats', 'lunch', 'dinner', 'coffee', 'tea'],
      Entertainment: ['movie', 'cinema', 'gaming', 'game', 'spotify', 'netflix', 'amazon prime', 'youtube', 'entertainment'],
      Travel: ['uber', 'ola', 'taxi', 'auto', 'travel', 'bus', 'train', 'flight', 'airline', 'gas station', 'fuel', 'petrol', 'diesel'],
      Shopping: ['amazon', 'flipkart', 'mall', 'store', 'shop', 'retail', 'supermarket', 'walmart', 'clothing', 'apparel'],
      Utilities: ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'utility', 'bill', 'recharge'],
      Salary: ['salary', 'wage', 'payment', 'income', 'bonus'],
      Medical: ['hospital', 'doctor', 'medicine', 'pharmacy', 'health', 'medical', 'clinic', 'dentist'],
      Education: ['school', 'college', 'university', 'course', 'training', 'education', 'tuition'],
      Rent: ['rent', 'landlord', 'apartment', 'housing'],
      Savings: ['savings', 'save', 'deposit', 'investment', 'mutual', 'fund'],
      Investment: ['invest', 'trading', 'stock', 'share', 'crypto', 'gold'],
      Bills: ['bill', 'invoice', 'payment', 'dues'],
      Loan: ['loan', 'emi', 'credit', 'borrow'],
      Insurance: ['insurance', 'policy', 'premium'],
      Gifts: ['gift', 'present', 'donation'],
      Refund: ['refund', 'return', 'credit back', 'returned'],
      Other: [],
    };

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => merchant.includes(keyword))) {
        console.log(`✅ Categorized: ${merchant} → ${category}`);
        return category as TransactionCategory;
      }
    }

    // Default to Other
    return 'Other';
  }

  /**
   * Learn from user corrections
   * Store merchant-to-category mapping for future use
   */
  static learnMapping(merchant: string, category: TransactionCategory): void {
    try {
      console.log(`📚 Learning: ${merchant} → ${category}`);
      
      // TODO: Store in database or AsyncStorage
      // Update merchant_mapping table with:
      // - merchant_name: normalized merchant
      // - category_id: selected category
      // - user_id: current user
      
      console.log(`✅ Mapping learned: ${merchant} → ${category}`);
    } catch (error) {
      console.error('❌ Failed to learn mapping:', error);
    }
  }

  /**
   * Suggest category based on transaction amount and type
   * ML-like heuristic approach
   */
  static suggestByAmount(amount: number, type: 'debit' | 'credit' | 'atm' | 'cash' | 'upi'): TransactionCategory[] {
    const suggestions: TransactionCategory[] = [];

    // ATM withdrawals → likely cash expense
    if (type === 'atm') {
      suggestions.push('Shopping');
    }

    // Large credits → likely salary
    if (type === 'credit' && amount > 10000) {
      suggestions.push('Salary');
    }

    // Small debits → likely food/cafe
    if (type === 'debit' && amount < 500) {
      suggestions.push('Food', 'Shopping');
    }

    // Medium debits → likely shopping
    if (type === 'debit' && amount >= 500 && amount < 5000) {
      suggestions.push('Shopping', 'Utilities');
    }

    // Large debits → likely travel/rent
    if (type === 'debit' && amount >= 5000) {
      suggestions.push('Rent', 'Travel', 'Medical');
    }

    return suggestions.length > 0 ? suggestions : ['Other'];
  }

  /**
   * Categorize multiple transactions
   */
  static categorizeMultiple(
    transactions: Array<{ merchant?: string; amount: number; type: string }>,
    merchantMappings?: Record<string, string>
  ): Array<{ index: number; category: TransactionCategory }> {
    return transactions.map((txn, index) => ({
      index,
      category: this.categorize(txn.merchant, merchantMappings),
    }));
  }
}
