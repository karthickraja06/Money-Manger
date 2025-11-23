# Phase 4 Task 2: Push Notifications - Implementation Guide

## Overview
Full push notification system implementation for Money Manager with device alerts and user preferences.

## What Was Added

### 1. Push Notifications Service (`src/services/pushNotifications.ts`)

**Core Features:**
- ✅ Expo Notifications API integration
- ✅ Device permission handling
- ✅ Push token management
- ✅ Local notifications (immediate & scheduled)
- ✅ User notification preferences
- ✅ Real-time notification listeners
- ✅ Quiet hours support
- ✅ Type-safe notification payloads

**Key Methods:**
```typescript
// Initialization
initialize(): Promise<void>
requestPermissions(): Promise<boolean>
getPushToken(): Promise<string | null>

// Send Notifications
sendNotification(payload): Promise<string | null>
scheduleNotification(notification): Promise<string | null>
cancelNotification(id): Promise<void>
cancelAllNotifications(): Promise<void>

// User Preferences
setPreferences(prefs): Promise<void>
getPreferences(): Promise<NotificationPreferences>

// Event Listeners
onNotificationResponse(callback): () => void
onNotificationReceived(callback): () => void

// Domain-Specific Alerts
sendTransactionAlert(amount, merchant, type): Promise<string | null>
sendLowBalanceAlert(balance, account): Promise<string | null>
sendBudgetWarning(category, spent, budget, %): Promise<string | null>
sendRecurringReminder(name, amount, date): Promise<string | null>
sendSyncNotification(status, count, error): Promise<string | null>
```

### 2. Notifications Settings Screen (`src/components/screens/NotificationsScreen.tsx`)

**Features:**
- Toggle individual notification types
- Manage quiet hours (24-hour schedule)
- Test notification sending
- Visual toggle switches
- Persistent preferences
- Real-time feedback

**Notification Types:**
- 💳 Transaction Alerts
- ⚠️ Low Balance Warnings
- 📊 Budget Warnings
- 🔔 Recurring Reminders
- 📢 System Messages

### 3. Package Installations
- `expo-notifications` - Local & push notifications
- `expo-device` - Device info & capabilities

## Notification Types

### 1. Transaction Alerts
Sent when SMS is synced successfully
```typescript
await PushNotificationService.sendTransactionAlert(
  amount: 500,
  merchant: 'Amazon',
  transactionType: 'debit'
);
// Output: "💸 You spent ₹500 at Amazon"
```

### 2. Low Balance Alerts
Sent when account balance falls below threshold
```typescript
await PushNotificationService.sendLowBalanceAlert(
  balance: 1000,
  account: 'HDFC Savings'
);
// Output: "Your HDFC Savings balance is only ₹1000. Top up soon!"
```

### 3. Budget Warnings
Sent when spending approaches/exceeds budget
```typescript
await PushNotificationService.sendBudgetWarning(
  category: 'Food & Dining',
  spent: 450,
  budget: 500,
  percentage: 90
);
// Output: "Food & Dining budget is 90% used (₹450/₹500)"
```

### 4. Recurring Reminders
Sent before recurring transactions are due
```typescript
await PushNotificationService.sendRecurringReminder(
  transactionName: 'Netflix Subscription',
  amount: 149,
  dueDate: '2025-11-30'
);
// Output: "Netflix Subscription - ₹149 is due on 2025-11-30"
```

### 5. Sync Status Notifications
Sent when SMS sync starts/completes/fails
```typescript
await PushNotificationService.sendSyncNotification(
  status: 'completed',
  count: 5
);
// Output: "Successfully synced 5 transactions"
```

## Integration Points

### 1. App Initialization (app/_layout.tsx)
```typescript
import { PushNotificationService } from '@/src/services';

export default function RootLayout() {
  useEffect(() => {
    const initNotifications = async () => {
      // Initialize push notifications on app start
      await PushNotificationService.initialize();

      // Listen for notification responses
      PushNotificationService.onNotificationResponse((response) => {
        console.log('Notification tapped:', response);
        // Navigate based on notification data
      });
    };

    initNotifications();

    return () => {
      PushNotificationService.cleanup();
    };
  }, []);

  return (
    // Existing layout
  );
}
```

### 2. SMS Sync Integration (SMSSyncManager)
```typescript
import { PushNotificationService } from '../services';

// In performSync()
await PushNotificationService.sendSyncNotification('started');

// After each successful parse
if (transaction) {
  await PushNotificationService.sendTransactionAlert(
    transaction.amount,
    transaction.merchant,
    transaction.type
  );
}

// On completion
await PushNotificationService.sendSyncNotification('completed', count);
```

### 3. Budget Tracking Integration
```typescript
// In BudgetScreen or BudgetService
const percentage = (spent / budget) * 100;
if (percentage >= 90) {
  await PushNotificationService.sendBudgetWarning(
    category,
    spent,
    budget,
    percentage
  );
}
```

### 4. Account Monitoring
```typescript
// Monitor balance and send alerts
if (balance < LOW_BALANCE_THRESHOLD) {
  await PushNotificationService.sendLowBalanceAlert(
    balance,
    accountName
  );
}
```

## Notification Preferences

### Default Settings
```typescript
{
  transactionAlerts: true,           // Enable transaction notifications
  lowBalanceAlerts: true,            // Enable low balance warnings
  budgetAlerts: true,                // Enable budget warnings
  recurringReminders: true,          // Enable recurring reminders
  systemMessages: true,              // Enable system messages
  quietHoursEnabled: false,          // Disable quiet hours by default
  quietHoursStart: '22:00',         // Start at 10 PM
  quietHoursEnd: '08:00',           // End at 8 AM
}
```

### Update Preferences
```typescript
// Enable only transaction alerts
await PushNotificationService.setPreferences({
  transactionAlerts: true,
  lowBalanceAlerts: false,
  budgetAlerts: false,
  recurringReminders: false,
  systemMessages: false,
});

// Enable quiet hours
await PushNotificationService.setPreferences({
  quietHoursEnabled: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '09:00',
});
```

## Push Token Management

### Get Push Token (for cloud notifications)
```typescript
const token = await PushNotificationService.getPushToken();
console.log('Push Token:', token);

// Send this token to your server
// Use to send cloud-based push notifications
await fetch('/api/user/push-token', {
  method: 'POST',
  body: JSON.stringify({ token }),
});
```

### Token Storage
- Cached in AsyncStorage for quick retrieval
- Automatically cached on first request
- Can be refreshed by clearing cache

## Event Listeners

### Listen for Notification Responses
```typescript
const unsubscribe = PushNotificationService.onNotificationResponse((response) => {
  const { notification } = response;
  console.log('Notification tapped:', notification.request.content.title);

  // Handle navigation or actions
  if (notification.request.content.data?.type === 'transaction') {
    // Navigate to transactions screen
  }
});

// Clean up when done
unsubscribe();
```

### Listen for Received Notifications
```typescript
const unsubscribe = PushNotificationService.onNotificationReceived((notification) => {
  console.log('Notification received while app open:', notification);
});

// Clean up when done
unsubscribe();
```

## Scheduled Notifications

### Schedule at Specific Time
```typescript
await PushNotificationService.scheduleNotification({
  id: 'monthly-reminder',
  title: '📊 Monthly Report',
  body: 'Your monthly expense report is ready',
  trigger: {
    type: 'daily',
    hour: 9,
    minute: 0,
  },
  data: {
    type: 'monthly_report',
  },
});
```

### Schedule Weekly Reminder
```typescript
await PushNotificationService.scheduleNotification({
  id: 'weekly-budget-check',
  title: '💰 Budget Check',
  body: 'Check your spending this week',
  trigger: {
    type: 'weekly',
    weekday: 1, // Monday
    hour: 10,
    minute: 0,
  },
});
```

### Schedule One-Time Notification
```typescript
await PushNotificationService.scheduleNotification({
  id: 'payment-reminder-123',
  title: '💳 Payment Due',
  body: 'Your credit card payment is due tomorrow',
  trigger: {
    type: 'time',
    seconds: 3600, // 1 hour from now
  },
});
```

## Testing Notifications

### Test with NotificationsScreen
1. Navigate to Notifications settings
2. Click "Test Basic Notification"
3. Should see notification immediately
4. Tap notification to test response handler

### Manual Testing
```typescript
// Test transaction alert
await PushNotificationService.sendTransactionAlert(1000, 'Amazon', 'debit');

// Test low balance alert
await PushNotificationService.sendLowBalanceAlert(500, 'HDFC');

// Test budget warning
await PushNotificationService.sendBudgetWarning('Food', 400, 500, 80);

// Test sync notification
await PushNotificationService.sendSyncNotification('completed', 5);
```

## Platform Support

| Feature | Android | iOS | Web |
|---------|---------|-----|-----|
| Local Notifications | ✅ | ✅ | ❌ |
| Scheduled Notifications | ✅ | ✅ | ❌ |
| Push Tokens | ✅ | ✅ | ❌ |
| Permission Handling | ✅ | ✅ | ❌ |
| Event Listeners | ✅ | ✅ | ❌ |
| Quiet Hours | ✅ | ✅ | ❌ |

## Troubleshooting

### "Permission denied" Error
- **Cause**: Notification permission not granted
- **Solution**: Grant permission in Settings → Notifications → Money Manager

### "getPushToken() returns null"
- **Cause**: Not on physical device or not configured
- **Solution**: Test on real device; web/simulator has limitations

### Notifications not showing
- **Cause**: App in foreground, quiet hours, or notification handler misconfigured
- **Solution**: Check preferences, handlers, and quiet hours settings

### Scheduled notifications not firing
- **Cause**: Trigger time in past or app not running
- **Solution**: Use future times; scheduled notifications require app running or system support

## Best Practices

1. **Check Preferences First**
   ```typescript
   const prefs = await PushNotificationService.getPreferences();
   if (!prefs.transactionAlerts) return;
   ```

2. **Use Appropriate Priorities**
   - `high`: Transaction alerts, Low balance warnings, Sync failures
   - `default`: Budget warnings, Recurring reminders

3. **Batch Multiple Notifications**
   - Don't spam users with too many alerts
   - Throttle notifications in quick succession

4. **Test on Real Device**
   - Simulators don't support all notification features
   - Firebase/Cloud notifications require real devices

5. **Cleanup Listeners**
   ```typescript
   useEffect(() => {
     const unsub = PushNotificationService.onNotificationResponse(...);
     return () => unsub();
   }, []);
   ```

## Phase 4 Task 2 Checklist
- ✅ Push Notifications service created
- ✅ Expo Notifications API integrated
- ✅ Device permission handling
- ✅ Notification preferences storage
- ✅ Domain-specific alert methods
- ✅ NotificationsScreen UI created
- ✅ Event listeners implemented
- ✅ Scheduled notifications support
- ✅ TypeScript compilation passing
- ✅ Documentation complete

## Next Steps
- Integrate with SMSSyncManager for transaction alerts
- Add to SettingsScreen for easy access
- Connect BudgetScreen to send budget warnings
- Set up recurring reminder scheduler
- Proceed to Task 3: Dark Mode Theme

