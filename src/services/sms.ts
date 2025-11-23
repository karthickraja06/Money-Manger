/**
 * SMS Service
 * Handles reading SMS messages from device
 * Filters and extracts transaction-related SMS
 * 
 * NOTE: In React Native environment, SMS reading requires:
 * - Android: READ_SMS permission + NativeModules access
 * - iOS: Limited access via MessageUI (no direct SMS reading)
 * 
 * For development/testing, we provide mock data functionality
 */

import { RawSMS } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SMSService {
  // Track processed SMS to avoid duplicates
  private static processedSmsIds: Set<string> = new Set();
  private static readonly STORAGE_KEY = 'processed_sms_ids';

  /**
   * Request SMS reading permissions
   * iOS: Messages app
   * Android: READ_SMS permission
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('📱 Requesting SMS permissions...');
      
      // For now, we assume permissions are granted
      // In production, integrate with:
      // - react-native-permissions (for both iOS and Android)
      // - Or specific Android: react-native-get-sms-android
      
      // Load previously processed SMS IDs
      await this.loadProcessedSmsIds();
      
      console.log('✅ SMS permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request SMS permissions:', error);
      return false;
    }
  }

  /**
   * Load processed SMS IDs from storage
   */
  private static async loadProcessedSmsIds(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.processedSmsIds = new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('❌ Failed to load processed SMS IDs:', error);
    }
  }

  /**
   * Save processed SMS IDs to storage
   */
  private static async saveProcessedSmsIds(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.processedSmsIds)));
    } catch (error) {
      console.error('❌ Failed to save processed SMS IDs:', error);
    }
  }

  /**
   * Read SMS messages from device
   * Returns list of SMS with metadata
   * 
   * NOTE: This is a mock implementation for development
   * In production, integrate with native SMS provider
   */
  static async readSMS(options?: {
    limit?: number;
    filter?: 'transaction' | 'all';
    daysBack?: number;
  }): Promise<RawSMS[]> {
    try {
      const limit = options?.limit || 100;
      const filter = options?.filter || 'transaction';
      const daysBack = options?.daysBack || 30;

      console.log(`📨 Reading SMS (limit: ${limit}, days: ${daysBack})...`);

      // For development: Return mock SMS data
      // In production: Query device SMS content provider
      const mockSms = await this.getMockSMS();
      
      // Filter by date
      const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      const filteredByDate = mockSms.filter(sms => sms.timestamp > cutoffDate);
      
      // Apply transaction filter if needed
      let result = filteredByDate;
      if (filter === 'transaction') {
        result = this.filterTransactionSMS(filteredByDate);
      }
      
      // Apply limit
      result = result.slice(0, limit);
      
      console.log(`✅ Read ${result.length} SMS messages`);
      return result;
    } catch (error) {
      console.error('❌ Failed to read SMS:', error);
      return [];
    }
  }

  /**
   * Get mock SMS for development/testing
   */
  static async getMockSMS(): Promise<RawSMS[]> {
    const now = Date.now();
    const oneDayAgo = now - (1 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'mock_hdfc_1',
        sender: 'HDFC_ALERT',
        body: 'Debit card xxxx1234 debited for Rs.1,00,000 at AMAZON.COM on 23-Nov-25. Balance: Rs.50,000. Ref: TXN123456',
        timestamp: now,
        read: false,
      },
      {
        id: 'mock_icici_1',
        sender: 'ICICI_BANK',
        body: 'Amount Rs.5,000 debited from your account. Txn Ref: ABC123. Balance: Rs.45,000. Merchant: Flipkart',
        timestamp: now - 3600000,
        read: false,
      },
      {
        id: 'mock_sbi_1',
        sender: 'SBI_SECURITY',
        body: 'ATM withdrawal of Rs.10,000 on 23-11-2025. Available balance: Rs.35,000. Ref: SBI999',
        timestamp: now - 7200000,
        read: false,
      },
      {
        id: 'mock_hdfc_2',
        sender: 'HDFC_ALERT',
        body: 'Credit of Rs.50,000 received in your account on 23-Nov-25. Balance: Rs.1,00,000. Ref: CRD999',
        timestamp: oneDayAgo,
        read: false,
      },
      {
        id: 'mock_axis_1',
        sender: 'AXIS_BANK',
        body: 'Rs.2,500 debited towards Ola Ride. Ref: XYZ789. Balance: Rs.47,500',
        timestamp: oneDayAgo - 3600000,
        read: false,
      },
      {
        id: 'mock_upi_1',
        sender: 'UPI_GPAY',
        body: 'You sent Rs.500 to Rohan via UPI. Ref: 202511231234567. Balance: Rs.9,500',
        timestamp: oneDayAgo - 7200000,
        read: false,
      },
    ];
  }

  /**
   * Filter SMS by transaction keywords
   * Looks for banking/transaction related terms
   */
  static filterTransactionSMS(sms: RawSMS[]): RawSMS[] {
    const transactionKeywords = [
      'debit', 'credit', 'amount', 'balance', 'transaction',
      'payment', 'transferred', 'received', 'debited', 'credited',
      'rupees', 'rs', '₹', 'account', 'card', 'atm', 'upi',
      'hdfc', 'icici', 'axis', 'sbi', 'bank'
    ];

    return sms.filter(msg => {
      const text = msg.body.toLowerCase();
      return transactionKeywords.some(keyword => text.includes(keyword));
    });
  }

  /**
   * Get SMS by sender (bank)
   */
  static getSMSByBank(sms: RawSMS[], bank: string): RawSMS[] {
    const bankPatterns: Record<string, string[]> = {
      HDFC: ['hdfc', 'hdfcbank'],
      ICICI: ['icici', 'icicbank'],
      AXIS: ['axis', 'axisbank'],
      SBI: ['sbi', 'sbisecurity'],
      UPI: ['upi', 'gpay', 'paytm', 'phonepe'],
    };

    const patterns = bankPatterns[bank] || [];
    return sms.filter(msg => 
      patterns.some(pattern => msg.sender.toLowerCase().includes(pattern))
    );
  }

  /**
   * Check if SMS is already processed
   */
  static isNewSMS(sms: RawSMS): boolean {
    return !this.processedSmsIds.has(sms.id);
  }

  /**
   * Get unprocessed SMS (new transactions)
   */
  static async getUnprocessedSMS(): Promise<RawSMS[]> {
    try {
      console.log('🔍 Checking for new SMS messages...');

      // Read all transaction SMS
      const sms = await this.readSMS({ filter: 'transaction' });
      
      // Filter to only new ones
      const newSMS = sms.filter(msg => this.isNewSMS(msg));

      console.log(`✅ Found ${newSMS.length} new SMS messages`);
      return newSMS;
    } catch (error) {
      console.error('❌ Failed to get unprocessed SMS:', error);
      return [];
    }
  }

  /**
   * Mark SMS as processed
   * Store reference for duplicate detection
   */
  static async markProcessed(sms: RawSMS): Promise<void> {
    try {
      this.processedSmsIds.add(sms.id);
      await this.saveProcessedSmsIds();
      console.log(`✅ Marked SMS as processed: ${sms.id}`);
    } catch (error) {
      console.error('❌ Failed to mark SMS as processed:', error);
    }
  }

  /**
   * Clear all processed SMS (for testing)
   */
  static async clearProcessedSMS(): Promise<void> {
    try {
      this.processedSmsIds.clear();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Cleared processed SMS history');
    } catch (error) {
      console.error('❌ Failed to clear processed SMS:', error);
    }
  }
}
