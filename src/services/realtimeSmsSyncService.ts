/**
 * Best Practice: TypeScript Syncs from Java Storage
 * 
 * Strategy:
 * 1. Java BroadcastReceiver stores SMS to SharedPreferences (works background)
 * 2. TypeScript syncs stored SMS when app opens
 * 3. Emits events for instant UI update when app is active
 * 4. Combined = works foreground AND background
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { DatabaseService } from './database';
import { TransactionParser } from './parser';

const { SMSManagerModule } = NativeModules;

export class RealtimeSyncService {
  private static eventEmitter: NativeEventEmitter | null = null;
  private static smsReceivedSubscription: any = null;
  private static isListening = false;

  /**
   * Start listening for real-time SMS events
   * Also syncs any stored SMS from background (via SharedPreferences)
   */
  static async startRealtimeSync(userId: string) {
    if (Platform.OS !== 'android' || !SMSManagerModule) {
      console.log('❌ Real-time SMS sync only available on Android');
      return;
    }

    if (this.isListening) {
      console.log('⚠️ Real-time sync already active');
      return;
    }

    try {
      // Sync any SMS that arrived while app was closed
      await this.syncStoredSMS(userId);

      // Initialize event emitter for future SMS
      this.eventEmitter = new NativeEventEmitter(SMSManagerModule);

      // Listen for SMS_RECEIVED events from BroadcastReceiver (when app is active)
      this.smsReceivedSubscription = this.eventEmitter.addListener(
        'SMSReceived',
        async (event: any) => {
          console.log(`📨 Real-time SMS from ${event.sender}`);
          await this.processSMSEvent(event, userId);
        }
      );

      SMSManagerModule.startRealtimeSync();
      this.isListening = true;
      console.log('✅ Real-time SMS sync started (foreground + background)');
    } catch (error) {
      console.error('Failed to start real-time sync:', error);
    }
  }

  /**
   * Sync SMS that was stored by BroadcastReceiver while app was closed
   */
  private static async syncStoredSMS(userId: string) {
    try {
      // Read from SharedPreferences via native module
      if (!SMSManagerModule?.getStoredSMS) {
        console.log('ℹ️ No stored SMS handler available');
        return;
      }

      const storedSMS = await SMSManagerModule.getStoredSMS();
      if (!storedSMS || storedSMS.length === 0) {
        return;
      }

      console.log(`🔄 Syncing ${storedSMS.length} stored SMS from background...`);
      
      for (const sms of storedSMS) {
        await this.processSMSEvent(sms, userId);
      }

      // Clear stored SMS after syncing
      if (SMSManagerModule?.clearStoredSMS) {
        await SMSManagerModule.clearStoredSMS();
      }

      console.log('✅ Background SMS synced');
    } catch (error) {
      console.error('Error syncing stored SMS:', error);
    }
  }

  static stopRealtimeSync() {
    if (this.smsReceivedSubscription) {
      this.smsReceivedSubscription.remove();
      this.smsReceivedSubscription = null;
    }

    if (SMSManagerModule && this.isListening) {
      SMSManagerModule.stopRealtimeSync();
      this.isListening = false;
      console.log('❌ Real-time SMS sync stopped');
    }
  }

  private static async processSMSEvent(event: any, userId: string) {
    try {
      const sms = {
        id: `sms_${event.sender}_${event.timestamp}`,
        sender: event.sender,
        body: event.body,
        timestamp: event.timestamp,
        read: false,
      };

      // Parse transaction
      const parsed = TransactionParser.parse(sms);
      if (!parsed || !TransactionParser.validate(parsed)) {
        console.log('⏭️ Could not parse SMS as transaction');
        return;
      }

      // Store in database
      await DatabaseService.createTransaction(userId, {
        account_id: 'sms_default', // Default account for SMS transactions
        type: parsed.type,
        amount: parsed.amount,
        merchant: parsed.merchant || 'Unknown',
        category_id: 'default', // TODO: Get actual category ID
        tags: ['sms_transaction'],
        date: parsed.date.toISOString(),
        is_income: parsed.type === 'credit',
        is_expense: parsed.type === 'debit',
        original_amount: parsed.amount,
        net_amount: parsed.amount,
        is_linked: false,
        notes: `SMS from ${sms.sender}`,
      });
      console.log(`✅ Transaction auto-synced: ₹${parsed.amount}`);
    } catch (error) {
      console.error('Error processing SMS event:', error);
    }
  }

  static isActive(): boolean {
    return this.isListening;
  }
}
