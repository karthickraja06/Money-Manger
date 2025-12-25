/**
 * PHASE 7: Reminder & Notifications Service
 * Manages local and push notifications for dues and reminders
 * 
 * Features:
 * - Schedule notifications
 * - Local reminders
 * - Due date notifications
 * - Configurable advance reminders
 */

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

export interface ReminderConfig {
  daysBeforeDue?: number;
  notificationTime?: string; // HH:mm format
  enabled: boolean;
}

export class ReminderService {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a due date reminder
   */
  static async scheduleDueReminder(
    dueId: string,
    dueName: string,
    dueDate: Date,
    amount: number,
    config: ReminderConfig = { daysBeforeDue: 1, enabled: true }
  ): Promise<string | null> {
    if (!config.enabled) return null;

    try {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(
        reminderDate.getDate() - (config.daysBeforeDue || 1)
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📌 Reminder: ${dueName}`,
          body: `Due amount: ₹${amount.toLocaleString('en-IN')}`,
          data: { dueId },
        },
        trigger: {
          type: 'date' as any,
          date: reminderDate,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return null;
    }
  }

  /**
   * Schedule an overdue notification
   */
  static async scheduleOverdueNotification(
    dueId: string,
    dueName: string,
    amount: number
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ OVERDUE: ${dueName}`,
          body: `Amount due: ₹${amount.toLocaleString('en-IN')}`,
          data: { dueId },
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 10,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule overdue notification:', error);
      return null;
    }
  }

  /**
   * Schedule budget alert notification
   */
  static async scheduleBudgetAlert(
    categoryName: string,
    percentageUsed: number,
    amount: number
  ): Promise<string | null> {
    try {
      const title =
        percentageUsed >= 100
          ? `🚨 Budget Exceeded: ${categoryName}`
          : `⚠️ Budget Alert: ${categoryName}`;

      const body =
        percentageUsed >= 100
          ? `You've spent ₹${amount.toLocaleString('en-IN')} (exceeded limit)`
          : `You've used ${percentageUsed}% of your budget`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'budget' },
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 10,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule budget alert:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification
   */
  static async sendImmediateNotification(
    title: string,
    body: string
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 1,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
      return null;
    }
  }
}
