/**
 * PHASE 6: Budget Service
 * Manages budget creation, tracking, and alert generation
 * 
 * Features:
 * - Set monthly budgets per category
 * - Track spending against budgets
 * - Generate alerts at thresholds (80%, 100%)
 * - Calculate remaining budget
 */

import { Budget } from '../types';
import { DatabaseService } from './database';

export interface BudgetAlert {
  category: string;
  threshold: number;
  currentUsage: number;
  percentageUsed: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export class BudgetService {
  /**
   * Create or update budget for a category
   */
  static async createBudget(
    userId: string,
    categoryId: string,
    amount: number,
    month: number,
    year: number
  ): Promise<Budget> {
    const budget: Budget = {
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      category_id: categoryId,
      month,
      year,
      amount,
      thresholds: { warning_percent: 80, critical_percent: 100 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // In production, save to database
    return budget;
  }

  /**
   * Get all budgets for a user
   */
  static async getBudgets(userId: string): Promise<Budget[]> {
    try {
      const budgets = await DatabaseService.getBudgets(userId);
      return budgets || [];
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      return [];
    }
  }

  /**
   * Get budget for specific category and month
   */
  static async getCategoryBudget(
    userId: string,
    categoryId: string,
    month: number,
    year: number
  ): Promise<Budget | null> {
    try {
      const budgets = await this.getBudgets(userId);
      return budgets.find(
        (b) =>
          b.category_id === categoryId && b.month === month && b.year === year
      ) || null;
    } catch (error) {
      console.error('Failed to fetch category budget:', error);
      return null;
    }
  }

  /**
   * Calculate spending for a category in a month
   */
  static async calculateCategorySpending(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    transactions: any[] = []
  ): Promise<number> {
    if (!transactions || transactions.length === 0) return 0;

    const monthTransactions = transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return (
        txnDate.getMonth() === month &&
        txnDate.getFullYear() === year &&
        txn.category_id === categoryId &&
        txn.is_expense
      );
    });

    return monthTransactions.reduce((sum, txn) => sum + (txn.net_amount || txn.amount), 0);
  }

  /**
   * Check and generate budget alerts
   */
  static async generateBudgetAlerts(
    userId: string,
    budgets: Budget[],
    transactions: any[] = []
  ): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const budget of budgets) {
      if (budget.month === currentMonth && budget.year === currentYear) {
        const spending = await this.calculateCategorySpending(
          userId,
          budget.category_id,
          currentMonth,
          currentYear,
          transactions
        );

        const percentageUsed = (spending / budget.amount) * 100;

        let status: 'ok' | 'warning' | 'exceeded' = 'ok';
        if (percentageUsed >= 100) {
          status = 'exceeded';
        } else if (percentageUsed >= 80) {
          status = 'warning';
        }

        alerts.push({
          category: budget.category_id,
          threshold: budget.amount,
          currentUsage: spending,
          percentageUsed: Math.round(percentageUsed),
          status,
        });
      }
    }

    return alerts;
  }

  /**
   * Get budget progress for display
   */
  static calculateBudgetProgress(
    spending: number,
    budgetAmount: number
  ): { percentage: number; color: string; label: string } {
    const percentage = Math.min((spending / budgetAmount) * 100, 100);

    let color = '#34C759'; // Green
    let label = 'On Track';

    if (percentage >= 100) {
      color = '#FF3B30'; // Red
      label = 'Exceeded';
    } else if (percentage >= 80) {
      color = '#FF9500'; // Orange
      label = 'Near Limit';
    }

    return { percentage: Math.round(percentage), color, label };
  }

  /**
   * Delete budget
   */
  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      // Delete from database when API is available
      console.log('Budget deleted:', budgetId);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  }
}
