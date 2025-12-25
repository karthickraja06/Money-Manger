/**
 * Services Index - Central export point for all services
 */

export { AdvancedAnalyticsService } from './advancedAnalytics';
export { AuthService } from './auth';
export * from './categoryIntegration';
export { DatabaseService } from './database';
export { TransactionParser, type ParsedSMS } from './parser';
export { PushNotificationService } from './pushNotifications';
export { SMSService } from './sms';
export { SMSNativeService } from './smsNative';
export { supabase } from './supabase';
// export { SMSSyncManager } from './smsSyncManager';

// Note: Import SMSSyncManager directly from './smsSyncManager' due to TypeScript resolution
