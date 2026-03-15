// User Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  email_invoice_updates?: boolean;
  email_weekly_summary?: boolean;
  email_marketing?: boolean;
  created_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
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
  display_name?: string;
  slug?: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  logo_shape?: 'rect' | 'circle';
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
  business?: number;
  business_id?: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency?: string;
  tax_invoice_number?: string;
  etims_synced_at?: string | null;
  status: 'draft' | 'sent' | 'paid' | 'pending' | 'partial';
  paid_at?: string | null;
  has_receipt?: boolean;
  receipt_number?: string | null;
  amount_paid?: number;
  balance_due?: number;
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
  status?: 'draft' | 'sent' | 'paid' | 'pending' | 'partial';
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
  notes?: string;
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

export interface TaxSummaryByMonth {
  month: string;
  tax_collected: number;
  tax_deductible: number;
}

export interface TaxSummary {
  total_tax_collected: number;
  total_tax_deductible: number;
  net_tax_liability: number;
  by_month: TaxSummaryByMonth[];
}

export interface ProfitLossBreakdownItem {
  amount: number;
  percentage: number;
  source?: string;
  category?: string;
}

export interface ProfitLossStatement {
  revenue: {
    total: number;
    breakdown: Array<ProfitLossBreakdownItem & { source: string }>;
  };
  expenses: {
    total: number;
    breakdown: Array<ProfitLossBreakdownItem & { category: string }>;
  };
  net_profit: number;
  profit_margin: number;
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

// Payments
export interface PaymentTransaction {
  id: number;
  reference: string;
  business: number;
  invoice: number;
  invoice_number?: string;
  phone_number: string;
  amount: number | string;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  merchant_request_id?: string;
  checkout_request_id?: string;
  mpesa_receipt_number?: string;
  result_code?: string;
  result_description?: string;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Messaging
export interface WhatsAppMessage {
  id: number;
  business: number;
  invoice: number;
  invoice_number?: string;
  phone_number: string;
  message_text: string;
  invoice_link: string;
  delivery_status: 'pending' | 'sent' | 'failed';
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Tax
export interface TaxSubmission {
  id: number;
  business: number;
  invoice: number;
  invoice_number?: string;
  status: 'pending' | 'submitted' | 'failed';
  tax_invoice_number?: string;
  error_message?: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
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
