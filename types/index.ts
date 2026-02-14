// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message: string;
}

// Business Types
export interface Business {
  id: number;
  owner: number;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  tax_rate: number;
  created_at: string;
}

// Invoice Types
export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  business: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
  items: InvoiceItem[];
}

export interface CreateInvoiceData {
  business_id: number;
  client_name: string;
  client_email: string;
  issue_date: string;
  due_date: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  status?: 'draft' | 'sent' | 'paid';
}

export interface InvoiceFilters {
  status?: 'draft' | 'sent' | 'paid';
  client_name?: string;
  date_from?: string;
  date_to?: string;
  business_id?: number;
}

// Expense Types
export interface Expense {
  id: number;
  business: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  tax_deductible: boolean;
  created_at: string;
}

export interface CreateExpenseData {
  business_id: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  tax_deductible: boolean;
}

// Report Types
export interface MonthlyReport {
  month: string;
  total_income: number;
  total_expenses: number;
  tax_owed: number;
  deductible_expenses: number;
  net_profit: number;
  invoice_count: number;
  expense_count: number;
}

export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  pending_invoices: number;
  overdue_invoices: number;
  recent_invoices: Invoice[];
  recent_expenses: Expense[];
  monthly_trends: MonthlyReport[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Form Validation Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

// Expense category constants/types
export { EXPENSE_CATEGORIES } from './expense';
export type { ExpenseCategory, ExpenseFilters } from './expense';
