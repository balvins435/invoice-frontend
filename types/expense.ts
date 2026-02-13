import { Expense, CreateExpenseData } from './index';

// frontend/types/expense.ts

export type ExpenseCategory = 
  | 'office_supplies'
  | 'travel'
  | 'marketing'
  | 'utilities'
  | 'rent'
  | 'salaries'
  | 'equipment'
  | 'software'
  | 'meals'
  | 'healthcare'
  | 'education'
  | 'shopping'
  | 'other';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  office_supplies: 'Office Supplies',
  travel: 'Travel & Transportation',
  marketing: 'Marketing & Advertising',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries & Wages',
  equipment: 'Equipment',
  software: 'Software & Subscriptions',
  meals: 'Meals & Entertainment',
  healthcare: 'Healthcare',
  education: 'Education & Training',
  shopping: 'Shopping',
  other: 'Other',
};

export interface Expense {
  id: number;
  business: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  tax_deductible: boolean;
  created_at: string;
}

export interface CreateExpenseData {
  business_id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  tax_deductible: boolean;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  date_from?: string;
  date_to?: string;
  tax_deductible?: boolean;
  min_amount?: number;
  max_amount?: number;
}

export interface ExpenseSummary {
  total: number;
  by_category: Record<string, number>;
  deductible: number;
  non_deductible: number;
}