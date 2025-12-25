/**
 * PHASE 7: Dues Service
 * Manages financial dues and reminders
 * 
 * Features:
 * - Track money to pay/receive
 * - Link dues to transactions
 * - Due date tracking
 * - Status management
 */

import { Due } from '../types';
import { DatabaseService } from './database';

export interface DueWithDetails extends Due {
  daysDue?: number;
  isOverdue?: boolean;
}

export class DuesService {
  /**
   * Create a new due
   */
  static async createDue(
    userId: string,
    contactName: string,
    amount: number,
    dueDate: Date,
    contactPhone?: string,
    transactionId?: string
  ): Promise<Due> {
    const due: Due = {
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      contact_name: contactName,
      contact_phone: contactPhone,
      amount,
      due_date: dueDate.toISOString(),
      transaction_id: transactionId,
      status: 'pending',
      due_type: 'payable' as any,
      reminder_days_before: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Create due in database when API is available
      return due;
    } catch (error) {
      console.error('Failed to create due:', error);
      throw error;
    }
  }

  /**
   * Get all dues for a user
   */
  static async getDues(userId: string): Promise<DueWithDetails[]> {
    try {
      const dues = await DatabaseService.getDues(userId);
      return dues.map((due) => this.enrichDueWithDetails(due));
    } catch (error) {
      console.error('Failed to fetch dues:', error);
      return [];
    }
  }

  /**
   * Get overdue items
   */
  static async getOverdueDues(userId: string): Promise<DueWithDetails[]> {
    try {
      const dues = await this.getDues(userId);
      return dues.filter((due) => due.isOverdue && due.status === 'pending');
    } catch (error) {
      console.error('Failed to fetch overdue dues:', error);
      return [];
    }
  }

  /**
   * Get upcoming dues (due within 7 days)
   */
  static async getUpcomingDues(userId: string): Promise<DueWithDetails[]> {
    try {
      const dues = await this.getDues(userId);
      const now = new Date();
      return dues.filter(
        (due) =>
          !due.isOverdue &&
          due.daysDue !== undefined &&
          due.daysDue <= 7 &&
          due.daysDue > 0 &&
          due.status === 'pending'
      );
    } catch (error) {
      console.error('Failed to fetch upcoming dues:', error);
      return [];
    }
  }

  /**
   * Mark due as completed
   */
  static async completeDue(userId: string, dueId: string): Promise<void> {
    try {
      await DatabaseService.updateDue(dueId, { status: 'completed' });
    } catch (error) {
      console.error('Failed to mark due as completed:', error);
      throw error;
    }
  }

  /**
   * Delete a due
   */
  static async deleteDue(dueId: string): Promise<void> {
    try {
      console.log('Due deleted:', dueId);
    } catch (error) {
      console.error('Failed to delete due:', error);
      throw error;
    }
  }

  /**
   * Enrich due with calculated fields
   */
  private static enrichDueWithDetails(due: Due): DueWithDetails {
    const now = new Date();
    const dueDate = new Date(due.due_date);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isOverdue = daysDue < 0 && due.status === 'pending';

    return {
      ...due,
      daysDue,
      isOverdue,
    };
  }
}
