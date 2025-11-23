/**
 * Notification Service
 * 
 * Handles:
 * - Sync completion notifications
 * - Low balance alerts
 * - Budget warnings
 * - Recurring transaction reminders
 */

export interface Notification {
  id: string;
  type: 'sync_complete' | 'low_balance' | 'budget_warning' | 'recurring_reminder' | 'info';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export class NotificationService {
  private static notifications: Notification[] = [];
  private static notificationCallbacks: Array<(notification: Notification) => void> = [];
  private static readonly LOW_BALANCE_THRESHOLD = 5000; // ₹5000

  /**
   * Subscribe to new notifications
   */
  static subscribe(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Send notification
   */
  private static sendNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    console.log(`📬 Notification: ${notification.title}`);
    
    // Trigger all subscribed callbacks
    this.notificationCallbacks.forEach(cb => cb(notification));
  }

  /**
   * Notify sync completion
   */
  static notifySyncComplete(result: {
    success: boolean;
    smsRead: number;
    smsProcessed: number;
    transactionsStored: number;
    failed: number;
    errors: string[];
  }): void {
    const notification: Notification = {
      id: `sync_${Date.now()}`,
      type: 'sync_complete',
      title: result.success ? '✅ Sync Complete' : '⚠️ Sync Failed',
      message: result.success
        ? `Processed ${result.smsProcessed} SMS, stored ${result.transactionsStored} transactions`
        : `Sync failed. Errors: ${result.errors.length}`,
      icon: result.success ? '✅' : '❌',
      timestamp: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Notify low balance alert
   */
  static notifyLowBalance(account: {
    accountId: string;
    bankName: string;
    balance: number;
  }): void {
    if (account.balance < this.LOW_BALANCE_THRESHOLD) {
      const notification: Notification = {
        id: `low_balance_${account.accountId}`,
        type: 'low_balance',
        title: '🔔 Low Balance Alert',
        message: `Your ${account.bankName} account balance is ${this.formatCurrency(account.balance)}`,
        icon: '⚠️',
        timestamp: new Date(),
        read: false,
        actionUrl: `/accounts/${account.accountId}`,
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Notify budget warning
   */
  static notifyBudgetWarning(category: string, spent: number, limit: number): void {
    const percentage = (spent / limit) * 100;

    let message = '';
    let title = '';

    if (percentage >= 100) {
      title = `🚫 Budget Exceeded: ${category}`;
      message = `You've spent ₹${spent} of your ₹${limit} budget in ${category}`;
    } else if (percentage >= 80) {
      title = `⚠️ Budget Alert: ${category}`;
      message = `You've spent ${percentage.toFixed(0)}% of your ${category} budget`;
    }

    if (title) {
      const notification: Notification = {
        id: `budget_${category}_${Date.now()}`,
        type: 'budget_warning',
        title,
        message,
        icon: percentage >= 100 ? '🚫' : '⚠️',
        timestamp: new Date(),
        read: false,
        actionUrl: '/budget',
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Notify recurring transaction reminder
   */
  static notifyRecurringReminder(transaction: {
    merchant: string;
    amount: number;
    daysUntilDue: number;
  }): void {
    const notification: Notification = {
      id: `recurring_${transaction.merchant}_${Date.now()}`,
      type: 'recurring_reminder',
      title: `🔄 Recurring Payment Reminder`,
      message: `${transaction.merchant} payment of ₹${transaction.amount} due in ${transaction.daysUntilDue} days`,
      icon: '🔄',
      timestamp: new Date(),
      read: false,
      actionUrl: '/transactions',
    };

    this.sendNotification(notification);
  }

  /**
   * Send info notification
   */
  static notifyInfo(title: string, message: string, actionUrl?: string): void {
    const notification: Notification = {
      id: `info_${Date.now()}`,
      type: 'info',
      title,
      message,
      icon: 'ℹ️',
      timestamp: new Date(),
      read: false,
      actionUrl,
    };

    this.sendNotification(notification);
  }

  /**
   * Get all notifications
   */
  static getNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Get unread notifications count
   */
  static getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all as read
   */
  static markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Delete notification
   */
  static deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  /**
   * Clear all notifications
   */
  static clearAll(): void {
    this.notifications = [];
  }

  /**
   * Format currency
   */
  private static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Get notifications grouped by type
   */
  static getGroupedNotifications(): Record<string, Notification[]> {
    const grouped: Record<string, Notification[]> = {};

    this.notifications.forEach(notification => {
      if (!grouped[notification.type]) {
        grouped[notification.type] = [];
      }
      grouped[notification.type].push(notification);
    });

    return grouped;
  }

  /**
   * Send batch notifications (e.g., after sync)
   */
  static sendBatchNotifications(syncResult: any, accounts: any[], budgets: any[]): void {
    // Sync notification
    this.notifySyncComplete(syncResult);

    // Check low balances
    accounts.forEach((account: any) => {
      if (account.balance < this.LOW_BALANCE_THRESHOLD) {
        this.notifyLowBalance({
          accountId: account.id,
          bankName: account.bank_name,
          balance: account.balance,
        });
      }
    });

    // Check budgets
    budgets.forEach((budget: any) => {
      const spent = budget.spent;
      const limit = budget.limit;
      if (spent > limit * 0.8) { // Alert at 80% threshold
        this.notifyBudgetWarning(budget.category, spent, limit);
      }
    });
  }
}
