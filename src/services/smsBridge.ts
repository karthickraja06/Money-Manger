/**
 * SMS Manager Native Module Bridge
 * Bridges React Native code with native Android SMS reading
 * 
 * This provides the actual implementation for reading SMS from Android's SMS ContentProvider
 */

import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

interface SMSMessage {
  _id?: string;
  id?: string;
  address?: string;
  sender?: string;
  body?: string;
  date?: number;
  type?: number;
}

interface ISMSManager {
  getAllSMS(): Promise<SMSMessage[]>;
  getSMSCount(): Promise<number>;
  requestSMSPermission(): Promise<boolean>;
  checkSMSPermission(): Promise<boolean>;
}

// Get or create native module
let SMSManager: ISMSManager | null = null;

export const initializeSMSManager = async (): Promise<ISMSManager> => {
  if (SMSManager) {
    return SMSManager;
  }

  if (Platform.OS !== 'android') {
    console.warn('SMSManager only available on Android');
    return {
      getAllSMS: async () => [],
      getSMSCount: async () => 0,
      requestSMSPermission: async () => false,
      checkSMSPermission: async () => false,
    };
  }

  try {
    // Try to get native module
    SMSManager = NativeModules.SMSManager as ISMSManager;

    if (!SMSManager) {
      console.warn('Native SMSManager module not available');
      // Return a fallback implementation
      SMSManager = {
        getAllSMS: async () => [],
        getSMSCount: async () => 0,
        requestSMSPermission: requestSMSPermissionFallback,
        checkSMSPermission: checkSMSPermissionFallback,
      };
    }

    return SMSManager;
  } catch (error) {
    console.error('Error initializing SMSManager:', error);
    // Return fallback
    return {
      getAllSMS: async () => [],
      getSMSCount: async () => 0,
      requestSMSPermission: requestSMSPermissionFallback,
      checkSMSPermission: checkSMSPermissionFallback,
    };
  }
};

/**
 * Fallback implementation using React Native PermissionsAndroid
 */
async function requestSMSPermissionFallback(): Promise<boolean> {
  try {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Money Manager - SMS Access Required',
        message:
          'Money Manager needs permission to read your SMS messages to import bank transactions.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );

    return permission === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting SMS permission:', error);
    return false;
  }
}

/**
 * Fallback implementation for checking SMS permission
 */
async function checkSMSPermissionFallback(): Promise<boolean> {
  try {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    return result === true;
  } catch (error) {
    console.error('Error checking SMS permission:', error);
    return false;
  }
}

export const SMSManagerModule = {
  /**
   * Request SMS reading permission
   */
  requestPermission: async (): Promise<boolean> => {
    const manager = await initializeSMSManager();
    return manager.requestSMSPermission();
  },

  /**
   * Check if SMS permission is granted
   */
  hasPermission: async (): Promise<boolean> => {
    const manager = await initializeSMSManager();
    return manager.checkSMSPermission();
  },

  /**
   * Get all SMS messages from device
   */
  getAllSMS: async (): Promise<SMSMessage[]> => {
    const manager = await initializeSMSManager();
    try {
      const sms = await manager.getAllSMS();
      return sms || [];
    } catch (error) {
      console.error('Error getting all SMS:', error);
      return [];
    }
  },

  /**
   * Get SMS count
   */
  getSMSCount: async (): Promise<number> => {
    const manager = await initializeSMSManager();
    try {
      const count = await manager.getSMSCount();
      return count || 0;
    } catch (error) {
      console.error('Error getting SMS count:', error);
      return 0;
    }
  },
};
