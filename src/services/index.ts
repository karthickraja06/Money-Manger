/**
 * Services Index - Central export point for all services
 */

export { SMSService } from './sms';
export { TransactionParser, type ParsedSMS } from './parser';
export { DatabaseService } from './database';
export { AuthService } from './auth';
export { supabase } from './supabase';
export * from './categoryIntegration';
// export { SMSSyncManager } from './smsSyncManager';

// Note: Import SMSSyncManager directly from './smsSyncManager' due to TypeScript resolution
