/**
 * PHASE 8: Export/Import Service
 * Handles data backup and restore functionality
 * 
 * Features:
 * - Export data to JSON
 * - Import data from JSON
 * - Full backup support
 */

import { Account, Transaction } from '../types';
import { DatabaseService } from './database';

export interface BackupData {
  version: string;
  timestamp: string;
  transactions: Transaction[];
  accounts: Account[];
  metadata: {
    totalTransactions: number;
    totalAccounts: number;
  };
}

export class ExportImportService {
  /**
   * Export all user data to JSON
   */
  static async exportData(userId: string): Promise<BackupData | null> {
    try {
      const [transactions, accounts] = await Promise.all([
        DatabaseService.getTransactions(userId, 10000, 0).then((r) => r.data),
        DatabaseService.getAccounts(userId),
      ]);

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        transactions: transactions || [],
        accounts: accounts || [],
        metadata: {
          totalTransactions: transactions?.length || 0,
          totalAccounts: accounts?.length || 0,
        },
      };

      return backupData;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Export backup to JSON string
   */
  static async exportBackupToJSON(backupData: BackupData): Promise<string> {
    try {
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Failed to export backup:', error);
      return '';
    }
  }

  /**
   * Import data from JSON
   */
  static async importData(
    userId: string,
    backupData: BackupData
  ): Promise<boolean> {
    try {
      // Validate backup format
      if (!backupData.version || !backupData.transactions || !backupData.accounts) {
        console.error('Invalid backup format');
        return false;
      }

      // Import transactions
      for (const txn of backupData.transactions) {
        try {
          await DatabaseService.createTransaction(userId, txn);
        } catch (error) {
          console.warn(`Failed to import transaction ${txn.id}:`, error);
          continue;
        }
      }

      // Import accounts
      for (const account of backupData.accounts) {
        try {
          await DatabaseService.createAccount(userId, account);
        } catch (error) {
          console.warn(`Failed to import account ${account.id}:`, error);
          continue;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Generate backup statistics
   */
  static getBackupStats(backup: BackupData): {
    size: string;
    transactionCount: number;
    accountCount: number;
    dateRange: string;
  } {
    const sizeInBytes = JSON.stringify(backup).length;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);

    let dateRange = 'Unknown';
    if (backup.transactions && backup.transactions.length > 0) {
      const dates = backup.transactions.map((t) => new Date(t.date).getTime());
      const earliest = new Date(Math.min(...dates));
      const latest = new Date(Math.max(...dates));
      dateRange = `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
    }

    return {
      size: `${sizeInKB} KB`,
      transactionCount: backup.metadata.totalTransactions,
      accountCount: backup.metadata.totalAccounts,
      dateRange,
    };
  }
}
