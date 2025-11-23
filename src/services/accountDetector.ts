/**
 * Account Detector Service
 * 
 * Handles the complete SMS processing flow:
 * 1. Read SMS from device
 * 2. Detect bank from sender  
 * 3. Check if account exists
 * 4. Create account if new
 * 5. Link transaction to account
 * 6. Update account balance
 */

import { SMSService } from './sms';
import { TransactionParser } from './parser';
import { DatabaseService } from './database';
import { AutoCategorizer } from './categorizer';
import { RawSMS, BankName } from '../types';

export class AccountDetector {
  /**
   * Map of bank identifiers to BankName types
   * Used to detect which bank an SMS comes from
   */
  static readonly BANK_SENDER_MAP: Record<string, BankName> = {
    'HDFC': 'HDFC',
    'ICICI': 'ICICI', 
    'SBI': 'SBI',
    'UPI': 'Paytm', // Maps UPI to available Paytm type
    'GPAY': 'Paytm',
    'PHONEPE': 'PhonePe',
    'PAYTM': 'Paytm',
    'WHATSAPP': 'Other',
  };

  /**
   * Detect bank from SMS sender
   * Returns bank name if found, 'Other' as default
   */
  static detectBank(sms: RawSMS): BankName {
    const sender = sms.sender.toUpperCase();
    
    for (const [key, bank] of Object.entries(this.BANK_SENDER_MAP)) {
      if (sender.includes(key)) {
        console.log(`🏦 Detected bank: ${bank} (sender: ${sms.sender})`);
        return bank;
      }
    }
    
    console.log(`⚠️  Could not detect bank from sender: ${sms.sender}, defaulting to Other`);
    return 'Other';
  }

  /**
   * Check if account exists for a bank
   * Returns account ID if found, null otherwise
   */
  static async findExistingAccount(bank: BankName, userId: string): Promise<string | null> {
    try {
      console.log(`🔍 Checking for existing ${bank} account...`);

      // Get all accounts for this user
      const accounts = await DatabaseService.getAccounts(userId);
      
      // Find account matching this bank
      const existing = accounts.find(acc => acc.bank_name === bank);

      if (existing) {
        console.log(`✅ Found existing account: ${existing.id}`);
        return existing.id;
      }

      console.log(`ℹ️  No existing account found for ${bank}`);
      return null;
    } catch (error) {
      console.error(`❌ Error checking for existing account:`, error);
      return null;
    }
  }

  /**
   * Create new account for a bank
   * Returns new account ID
   */
  static async createNewAccount(
    bank: BankName,
    userId: string,
    balance?: number
  ): Promise<string | null> {
    try {
      console.log(`➕ Creating new ${bank} account...`);

      const newAccount = await DatabaseService.createAccount(userId, {
        bank_name: bank,
        account_number: `${bank.toUpperCase()}_${Date.now()}`, // Placeholder
        balance: balance || 0,
        created_from_sms: true,
        is_active: true,
      });

      console.log(`✅ Created new account: ${newAccount.id} for ${bank}`);
      return newAccount.id;
    } catch (error) {
      console.error(`❌ Error creating new account:`, error);
      return null;
    }
  }

  /**
   * Update account balance
   */
  static async updateAccountBalance(
    accountId: string,
    balance: number
  ): Promise<boolean> {
    try {
      console.log(`💰 Updating account balance to ${balance}...`);

      await DatabaseService.updateAccount(accountId, { balance });

      console.log(`✅ Account balance updated`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating account balance:`, error);
      return false;
    }
  }

  /**
   * Process a single SMS
   * Complete flow: detect bank → find/create account → parse → categorize → store
   */
  static async processSMS(
    sms: RawSMS,
    userId: string
  ): Promise<{
    success: boolean;
    accountId?: string;
    transactionId?: string;
    bank?: BankName;
    error?: string;
  }> {
    try {
      console.log(`\n📨 Processing SMS from ${sms.sender}...`);

      // Step 1: Detect bank
      const bank = this.detectBank(sms);

      // Step 2: Find or create account
      let accountId = await this.findExistingAccount(bank, userId);
      
      if (!accountId) {
        accountId = await this.createNewAccount(bank, userId);
        if (!accountId) {
          return {
            success: false,
            bank,
            error: `Failed to create account for ${bank}`
          };
        }
      }

      // Step 3: Parse SMS
      const parsed = TransactionParser.parse(sms);
      if (!parsed || !TransactionParser.validate(parsed)) {
        return {
          success: false,
          accountId,
          bank,
          error: `Failed to parse SMS or invalid transaction format`
        };
      }

      // Step 4: Determine if income or expense
      const isExpense = parsed.type === 'debit';
      const isIncome = parsed.type === 'credit';

      // Step 5: Store transaction (without category for now)
      // TODO: Create category assignment after transaction creation
      const newTransaction = await DatabaseService.createTransaction(userId, {
        account_id: accountId,
        type: parsed.type,
        amount: parsed.amount,
        merchant: parsed.merchant || 'Unknown',
        category_id: 'default', // TODO: Get actual category ID
        tags: [`sms_${bank.toLowerCase()}`],
        date: parsed.date.toISOString(),
        is_income: isIncome,
        is_expense: isExpense,
        original_amount: parsed.amount,
        net_amount: parsed.amount,
        is_linked: false,
        notes: `SMS from ${bank}`,
      });

      if (newTransaction) {
        console.log(`✅ Transaction stored: ${newTransaction.id}`);
        
        // Log transaction details
        console.log(`   Bank: ${bank}`);
        console.log(`   Account: ${accountId}`);
        console.log(`   Type: ${parsed.type}`);
        console.log(`   Amount: ${parsed.amount}`);
        console.log(`   Merchant: ${parsed.merchant || 'Unknown'}`);
        
        return {
          success: true,
          accountId,
          transactionId: newTransaction.id,
          bank,
        };
      }

      return {
        success: false,
        accountId,
        bank,
        error: 'Failed to store transaction'
      };
    } catch (error) {
      console.error(`❌ Error processing SMS:`, error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Batch process multiple SMS messages
   */
  static async processMultipleSMS(
    smsList: RawSMS[],
    userId: string
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    newAccounts: Set<string>;
    results: Array<{
      success: boolean;
      accountId?: string;
      transactionId?: string;
      bank?: BankName;
      error?: string;
    }>;
  }> {
    try {
      console.log(`\n📦 Batch processing ${smsList.length} SMS messages...`);

      const results = [];
      let successCount = 0;
      let failureCount = 0;
      const newAccountIds = new Set<string>();

      for (const sms of smsList) {
        const result = await this.processSMS(sms, userId);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      console.log(`\n✅ Batch processing complete:`);
      console.log(`   Total: ${smsList.length}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Failed: ${failureCount}`);
      console.log(`   New Accounts: ${newAccountIds.size}`);

      return {
        total: smsList.length,
        successful: successCount,
        failed: failureCount,
        newAccounts: newAccountIds,
        results,
      };
    } catch (error) {
      console.error(`❌ Error in batch processing:`, error);
      return {
        total: smsList.length,
        successful: 0,
        failed: smsList.length,
        newAccounts: new Set(),
        results: [],
      };
    }
  }

  /**
   * Full sync workflow
   * 1. Read all transaction SMS from device
   * 2. Filter for new messages
   * 3. Process each SMS
   * 4. Return summary
   */
  static async syncFromDevice(userId: string): Promise<{
    smsRead: number;
    processed: number;
    failed: number;
    newAccounts: number;
    accountsSummary: Array<{
      bank: BankName;
      accountId: string;
      balance: number;
    }>;
  }> {
    try {
      console.log(`\n🔄 Starting SMS sync from device...`);

      // Request permissions
      const hasPermission = await SMSService.requestPermissions();
      if (!hasPermission) {
        console.error(`❌ SMS permissions not granted`);
        return {
          smsRead: 0,
          processed: 0,
          failed: 0,
          newAccounts: 0,
          accountsSummary: [],
        };
      }

      // Read unprocessed SMS
      const unprocessedSMS = await SMSService.getUnprocessedSMS();
      console.log(`📨 Read ${unprocessedSMS.length} unprocessed SMS`);

      // Process each SMS
      const batchResult = await this.processMultipleSMS(unprocessedSMS, userId);

      // Get updated account summary
      const accounts = await DatabaseService.getAccounts(userId);
      const accountsSummary = accounts.map(acc => ({
        bank: acc.bank_name,
        accountId: acc.id,
        balance: acc.balance,
      }));

      console.log(`\n✅ Sync complete!`);
      console.log(`   SMS Read: ${unprocessedSMS.length}`);
      console.log(`   Processed: ${batchResult.successful}`);
      console.log(`   Failed: ${batchResult.failed}`);
      console.log(`   New Accounts: ${batchResult.newAccounts.size}`);
      console.log(`   Total Accounts: ${accountsSummary.length}`);

      return {
        smsRead: unprocessedSMS.length,
        processed: batchResult.successful,
        failed: batchResult.failed,
        newAccounts: batchResult.newAccounts.size,
        accountsSummary,
      };
    } catch (error) {
      console.error(`❌ Error during sync:`, error);
      return {
        smsRead: 0,
        processed: 0,
        failed: 0,
        newAccounts: 0,
        accountsSummary: [],
      };
    }
  }
}
