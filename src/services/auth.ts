/**
 * Authentication Service
 * Handles device-based and email authentication
 */

import { supabase } from './supabase';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'money_manager_user';
  private static readonly DEVICE_ID_STORAGE_KEY = 'money_manager_device_id';

  /**
   * Initialize or get existing user
   */
  static async initializeUser(): Promise<User> {
    try {
      // Check if user exists in storage
      let storedUser = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      if (storedUser) {
        return JSON.parse(storedUser);
      }

      // Create new device-based user
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_STORAGE_KEY);
      if (!deviceId) {
        deviceId = uuidv4();
        await AsyncStorage.setItem(this.DEVICE_ID_STORAGE_KEY, deviceId);
      }

      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          device_id: deviceId,
        })
        .select()
        .single();

      if (error) throw error;

      const user: User = {
        id: newUser.id,
        device_id: newUser.device_id,
        email: newUser.email,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      };

      await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const storedUser = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Update user email (optional)
   */
  static async updateUserEmail(email: string): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No user found');

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ email })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updated: User = {
        id: updatedUser.id,
        device_id: updatedUser.device_id,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      };

      await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error updating email:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}
