/**
 * PHASE 4: Push Notifications Service
 * 
 * Handles device push notifications for:
 * - Transaction synced alerts
 * - Low balance warnings
 * - Budget limit exceeded
 * - Recurring transaction reminders
 * - App updates and system messages
 * 
 * Features:
 * - Firebase Cloud Messaging (FCM) integration
 * - Expo Notifications API
 * - Background notification handling
 * - User notification preferences
 * - Scheduled notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'high';
}

export interface NotificationPreferences {
  transactionAlerts: boolean;
  lowBalanceAlerts: boolean;
  budgetAlerts: boolean;
  recurringReminders: boolean;
  systemMessages: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string;   // HH:mm
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: NotificationTrigger;
  data?: Record<string, any>;
}

type NotificationTrigger = {
  type: 'time';
  seconds: number;
} | {
  type: 'daily';
  hour: number;
  minute: number;
} | {
  type: 'weekly';
  weekday: number;
  hour: number;
  minute: number;
};

export class PushNotificationService {
  private static readonly STORAGE_KEY_PREFS = 'push_notification_prefs';
  private static readonly STORAGE_KEY_EXPOPUSH_TOKEN = 'expoPushToken';
  private static listeners: { [key: string]: Notifications.Subscription[] } = {};
  private static isInitialized = false;

  /**
   * Initialize push notifications
   * Call this once on app startup
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔔 Initializing push notifications...');

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        },
      });

      // Request permissions on physical device
      if (Device.isDevice) {
        await this.requestPermissions();
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        console.log(`✅ Push token obtained: ${token.substring(0, 20)}...`);
      }

      // Load preferences
      await this.loadPreferences();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private static async requestPermissions(): Promise<boolean> {
    try {
      console.log('📱 Requesting notification permissions...');

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ Notification permissions granted');
        return true;
      } else {
        console.warn('⚠️  Notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token
   * Store it on your server for sending notifications
   */
  static async getPushToken(): Promise<string | null> {
    try {
      // Check cached token
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY_EXPOPUSH_TOKEN);
      if (cached) {
        return cached;
      }

      if (!Device.isDevice) {
        console.log('ℹ️  Not a physical device, cannot get push token');
        return null;
      }

      // Get token from Expo
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      if (token) {
        // Cache token
        await AsyncStorage.setItem(this.STORAGE_KEY_EXPOPUSH_TOKEN, token);
      }

      return token;
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Send local notification immediately
   */
  static async sendNotification(payload: PushNotificationPayload): Promise<string | null> {
    try {
      console.log(`📢 Sending notification: "${payload.title}"`);
      
      // Check if we're in quiet hours
      if (this.isInQuietHours()) {
        console.log('🔇 Quiet hours active, notification will be silent');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          sound: payload.sound || 'default',
          badge: payload.badge || 1,
          priority: payload.priority || 'default',
          data: payload.data || {},
        },
        trigger: null, // Immediate
      });

      console.log(`✅ Notification sent successfully (ID: ${notificationId})`);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for specific time
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const trigger = this.parseTrigger(notification.trigger);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          data: notification.data || {},
        },
        trigger,
      });

      console.log(`✅ Notification scheduled: ${notification.title}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`✅ Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Cancelled all scheduled notifications');
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Listen for notification responses (when user taps notification)
   */
  static onNotificationResponse(
    callback: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);

    if (!this.listeners['response']) {
      this.listeners['response'] = [];
    }
    this.listeners['response'].push(subscription);

    return () => subscription.remove();
  }

  /**
   * Listen for notifications received while app is foreground
   */
  static onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ): () => void {
    const subscription = Notifications.addNotificationReceivedListener(callback);

    if (!this.listeners['received']) {
      this.listeners['received'] = [];
    }
    this.listeners['received'].push(subscription);

    return () => subscription.remove();
  }

  /**
   * Set notification preferences
   */
  static async setPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...prefs };

      await AsyncStorage.setItem(this.STORAGE_KEY_PREFS, JSON.stringify(updated));
      console.log('✅ Notification preferences updated');
    } catch (error) {
      console.error('❌ Failed to set preferences:', error);
    }
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY_PREFS);
      if (stored) {
        return JSON.parse(stored);
      }

      // Default preferences
      return {
        transactionAlerts: true,
        lowBalanceAlerts: true,
        budgetAlerts: true,
        recurringReminders: true,
        systemMessages: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };
    } catch (error) {
      console.error('❌ Failed to get preferences:', error);
      return {
        transactionAlerts: true,
        lowBalanceAlerts: true,
        budgetAlerts: true,
        recurringReminders: true,
        systemMessages: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };
    }
  }

  /**
   * Load preferences from storage
   */
  private static async loadPreferences(): Promise<void> {
    try {
      await this.getPreferences();
      console.log('✅ Loaded notification preferences');
    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private static isInQuietHours(): boolean {
    // TODO: Implement quiet hours check
    // For now, always return false
    return false;
  }

  /**
   * Parse trigger configuration
   */
  private static parseTrigger(trigger: NotificationTrigger): Notifications.NotificationTriggerInput {
    switch (trigger.type) {
      case 'time':
        return { type: 'timeInterval', seconds: trigger.seconds } as Notifications.NotificationTriggerInput;

      case 'daily':
        return {
          type: 'daily',
          hour: trigger.hour,
          minute: trigger.minute,
        } as Notifications.NotificationTriggerInput;

      case 'weekly':
        return {
          type: 'weekly',
          weekday: trigger.weekday,
          hour: trigger.hour,
          minute: trigger.minute,
        } as Notifications.NotificationTriggerInput;

      default:
        return { type: 'timeInterval', seconds: 5 } as Notifications.NotificationTriggerInput;
    }
  }

  /**
   * PHASE 4: Send transaction alert
   */
  static async sendTransactionAlert(
    amount: number,
    merchant: string,
    transactionType: 'debit' | 'credit'
  ): Promise<string | null> {
    try {
      const prefs = await this.getPreferences();
      if (!prefs.transactionAlerts) {
        return null;
      }

      const icon = transactionType === 'debit' ? '💸' : '💰';
      const action = transactionType === 'debit' ? 'spent' : 'received';

      return this.sendNotification({
        title: '💳 Transaction Synced',
        body: `${icon} You ${action} ₹${amount} at ${merchant}`,
        priority: 'high',
        data: {
          type: 'transaction',
          amount,
          merchant,
        },
      });
    } catch (error) {
      console.error('❌ Failed to send transaction alert:', error);
      return null;
    }
  }

  /**
   * PHASE 4: Send low balance alert
   */
  static async sendLowBalanceAlert(balance: number, account: string): Promise<string | null> {
    try {
      const prefs = await this.getPreferences();
      if (!prefs.lowBalanceAlerts) {
        return null;
      }

      return this.sendNotification({
        title: '⚠️  Low Balance Alert',
        body: `Your ${account} balance is only ₹${balance}. Top up soon!`,
        priority: 'high',
        data: {
          type: 'low_balance',
          balance,
          account,
        },
      });
    } catch (error) {
      console.error('❌ Failed to send low balance alert:', error);
      return null;
    }
  }

  /**
   * PHASE 4: Send budget warning
   */
  static async sendBudgetWarning(
    category: string,
    spent: number,
    budget: number,
    percentage: number
  ): Promise<string | null> {
    try {
      const prefs = await this.getPreferences();
      if (!prefs.budgetAlerts) {
        return null;
      }

      return this.sendNotification({
        title: '📊 Budget Alert',
        body: `${category} budget is ${percentage}% used (₹${spent}/₹${budget})`,
        priority: 'default',
        data: {
          type: 'budget_warning',
          category,
          spent,
          budget,
        },
      });
    } catch (error) {
      console.error('❌ Failed to send budget alert:', error);
      return null;
    }
  }

  /**
   * PHASE 4: Send recurring transaction reminder
   */
  static async sendRecurringReminder(
    transactionName: string,
    amount: number,
    dueDate: string
  ): Promise<string | null> {
    try {
      const prefs = await this.getPreferences();
      if (!prefs.recurringReminders) {
        return null;
      }

      return this.sendNotification({
        title: '🔔 Recurring Transaction Due',
        body: `${transactionName} - ₹${amount} is due on ${dueDate}`,
        priority: 'default',
        data: {
          type: 'recurring_reminder',
          transactionName,
          amount,
        },
      });
    } catch (error) {
      console.error('❌ Failed to send recurring reminder:', error);
      return null;
    }
  }

  /**
   * PHASE 4: Send sync status notification
   */
  static async sendSyncNotification(
    status: 'started' | 'completed' | 'failed',
    count?: number,
    error?: string
  ): Promise<string | null> {
    try {
      const prefs = await this.getPreferences();

      let title = '';
      let body = '';
      let priority: 'default' | 'high' = 'default';

      switch (status) {
        case 'started':
          title = '🔄 SMS Sync Started';
          body = 'Syncing your transactions...';
          break;

        case 'completed':
          title = '✅ Sync Complete';
          body = `Successfully synced ${count || 0} transactions`;
          priority = 'high';
          break;

        case 'failed':
          title = '❌ Sync Failed';
          body = error || 'Failed to sync SMS';
          priority = 'high';
          break;
      }

      return this.sendNotification({
        title,
        body,
        priority,
        data: {
          type: 'sync_status',
          status,
        },
      });
    } catch (error) {
      console.error('❌ Failed to send sync notification:', error);
      return null;
    }
  }

  /**
   * Clean up listeners
   */
  static cleanup(): void {
    try {
      Object.values(this.listeners).forEach((subscriptions) => {
        subscriptions.forEach((sub) => sub.remove());
      });
      this.listeners = {};
      console.log('✅ Cleaned up notification listeners');
    } catch (error) {
      console.error('❌ Error cleaning up listeners:', error);
    }
  }
}
