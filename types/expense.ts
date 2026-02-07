import { Expense, CreateExpenseData } from './index';

export type ExpenseCategory = 
  | 'office_supplies'
  | 'travel'
  | 'marketing'
  | 'utilities'
  | 'rent'
  | 'salaries'
  | 'equipment'
  | 'software'
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
  other: 'Other',
};

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