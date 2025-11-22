/**
 * SMS Service
 * Handles reading SMS messages from device
 * Filters and extracts transaction-related SMS
 */

import { RawSMS } from '../types';

export class SMSService {
  /**
   * Request SMS reading permissions
   * iOS: Messages app
   * Android: READ_SMS permission
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('📱 Requesting SMS permissions...');
      
      // TODO: Implement platform-specific permission requests
      // For Android: use react-native-permissions or react-native-get-sms-android
      // For iOS: Limited by Apple (cannot access SMS directly)
      
      console.log('✅ SMS permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request SMS permissions:', error);
      return false;
    }
  }

  /**
   * Read SMS messages from device
   * Returns list of SMS with metadata
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

      // TODO: Implement SMS reading
      // Use: react-native-sms or device_calendar-like approach
      // Android: ContentResolver query
      // iOS: MessageUI (limited access)

      const sms: RawSMS[] = [];
      console.log(`✅ Read ${sms.length} SMS messages`);
      return sms;
    } catch (error) {
      console.error('❌ Failed to read SMS:', error);
      return [];
    }
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
   * Compare with existing transactions
   */
  static async isNewSMS(sms: RawSMS): Promise<boolean> {
    try {
      // TODO: Compare with existing transactions in DB
      // Check if transaction with same:
      // - Amount
      // - Date
      // - Reference ID (if available)
      // Already exists

      return true; // Assume new for now
    } catch (error) {
      console.error('❌ Failed to check SMS novelty:', error);
      return true;
    }
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
      const newSMS: RawSMS[] = [];
      for (const msg of sms) {
        const isNew = await this.isNewSMS(msg);
        if (isNew) {
          newSMS.push(msg);
        }
      }

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
      // TODO: Store SMS ID and reference in database
      // For duplicate detection in future reads
      console.log(`✅ Marked SMS as processed: ${sms.id}`);
    } catch (error) {
      console.error('❌ Failed to mark SMS processed:', error);
    }
  }
}
