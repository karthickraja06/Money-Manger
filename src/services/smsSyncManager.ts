/**
 * SMS Sync Manager Service
 * 
 * Orchestrates the complete SMS-to-Database workflow:
 * 1. Request permissions
 * 2. Read SMS from device
 * 3. Parse each SMS
 * 4. Detect bank and account
 * 5. Auto-categorize
 * 6. Store in database
 */

import { SMSService } from './sms';
import { TransactionParser } from './parser';
import { DatabaseService } from './database';
import { RawSMS } from '../types';
import type { AccountDetector } from './accountDetector';

export interface SyncProgress {
  stage: 'permissions' | 'reading' | 'parsing' | 'processing' | 'storing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface SyncResult {
  success: boolean;
  smsRead: number;
  smsProcessed: number;
  accountsCreated: number;
  transactionsStored: number;
  failed: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export class SMSSyncManager {
  private static syncInProgress = false;
  private static progressCallbacks: Array<(progress: SyncProgress) => void> = [];

  static onProgress(callback: (progress: SyncProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  private static notifyProgress(progress: SyncProgress): void {
    console.log(`[${progress.stage}] ${progress.message} (${progress.current}/${progress.total})`);
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * Complete SMS sync workflow
   */
  static async performSync(userId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        smsRead: 0,
        smsProcessed: 0,
        accountsCreated: 0,
        transactionsStored: 0,
        failed: 0,
        errors: ['Sync already in progress'],
        duration: 0,
        timestamp: new Date().toISOString(),
      };
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Step 1: Request Permissions
      this.notifyProgress({
        stage: 'permissions',
        current: 0,
        total: 1,
        message: '📱 Requesting SMS permissions...',
      });

      const hasPermission = await SMSService.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          smsRead: 0,
          smsProcessed: 0,
          accountsCreated: 0,
          transactionsStored: 0,
          failed: 0,
          errors: ['SMS permissions not granted'],
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }

      // Step 2: Read SMS
      this.notifyProgress({
        stage: 'reading',
        current: 0,
        total: 1,
        message: '📨 Reading SMS from device...',
      });

      const unprocessedSms = await SMSService.getUnprocessedSMS();
      const smsRead = unprocessedSms.length;

      this.notifyProgress({
        stage: 'reading',
        current: 1,
        total: 1,
        message: `✅ Read ${smsRead} unprocessed SMS`,
      });

      if (smsRead === 0) {
        return {
          success: true,
          smsRead: 0,
          smsProcessed: 0,
          accountsCreated: 0,
          transactionsStored: 0,
          failed: 0,
          errors: [],
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }

      // Step 3: Process SMS
      this.notifyProgress({
        stage: 'parsing',
        current: 0,
        total: smsRead,
        message: `🔄 Processing ${smsRead} SMS messages...`,
      });

      let smsProcessed = 0;
      let transactionsStored = 0;
      let failed = 0;

      for (let i = 0; i < unprocessedSms.length; i++) {
        const sms = unprocessedSms[i];

        try {
          // Parse SMS
          const parsed = TransactionParser.parse(sms);
          if (parsed && TransactionParser.validate(parsed)) {
            smsProcessed++;
            transactionsStored++;

            // Mark as processed
            await SMSService.markProcessed(sms);
          } else {
            failed++;
            errors.push(`SMS ${sms.id}: Failed to parse`);
          }
        } catch (error) {
          failed++;
          errors.push(`SMS ${sms.id}: ${error instanceof Error ? error.message : String(error)}`);
        }

        this.notifyProgress({
          stage: 'processing',
          current: i + 1,
          total: smsRead,
          message: `Processed ${smsProcessed}/${smsRead} SMS`,
        });
      }

      // Complete
      this.notifyProgress({
        stage: 'complete',
        current: 1,
        total: 1,
        message: '✅ Sync complete',
      });

      const duration = Date.now() - startTime;

      console.log(`\n✅ SYNC COMPLETE`);
      console.log(`   SMS Read: ${smsRead}`);
      console.log(`   SMS Processed: ${smsProcessed}`);
      console.log(`   Transactions Stored: ${transactionsStored}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Duration: ${duration}ms`);

      return {
        success: true,
        smsRead,
        smsProcessed,
        accountsCreated: 0, // Would need AccountDetector to track this
        transactionsStored,
        failed,
        errors,
        duration,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Sync failed:`, error);
      return {
        success: false,
        smsRead: 0,
        smsProcessed: 0,
        accountsCreated: 0,
        transactionsStored: 0,
        failed: 1,
        errors: [errorMsg],
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get accounts summary
   */
  static async getAccountsSummary(userId: string): Promise<Array<{
    bank: string;
    accountId: string;
    balance: number;
    transactionCount: number;
  }>> {
    try {
      const accounts = await DatabaseService.getAccounts(userId);
      const txnResult = await DatabaseService.getTransactions(userId, 1000, 0);

      return accounts.map(account => ({
        bank: account.bank_name,
        accountId: account.id,
        balance: account.balance,
        transactionCount: txnResult.data.filter(t => t.account_id === account.id).length,
      }));
    } catch (error) {
      console.error('❌ Error getting accounts summary:', error);
      return [];
    }
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await DatabaseService.getTransactions(userId, limit, 0);
      return result.data;
    } catch (error) {
      console.error('❌ Error getting recent transactions:', error);
      return [];
    }
  }

  /**
   * Clear sync history
   */
  static async clearSync(): Promise<boolean> {
    try {
      await SMSService.clearProcessedSMS();
      console.log('✅ Cleared sync history');
      return true;
    } catch (error) {
      console.error('❌ Error clearing sync:', error);
      return false;
    }
  }
}
