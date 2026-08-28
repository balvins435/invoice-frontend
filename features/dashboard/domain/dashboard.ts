import { DashboardStats, Expense, Invoice } from '@/types';

export interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  pendingInvoices: number;
  totalClients: number;
  netProfit: number;
  recentInvoices: Invoice[];
  recentExpenses: Expense[];
}

export const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const selectDashboardMetrics = (stats: DashboardStats | null): DashboardMetrics => ({
  totalIncome: toFiniteNumber(stats?.total_income),
  totalExpenses: toFiniteNumber(stats?.total_expenses),
  pendingInvoices: toFiniteNumber(stats?.pending_invoices),
  totalClients: toFiniteNumber(stats?.total_clients),
  netProfit: toFiniteNumber(stats?.net_profit),
  recentInvoices: stats?.recent_invoices || [],
  recentExpenses: stats?.recent_expenses || [],
});

export const formatCompactMoney = (value: number, currency = 'KES', locale = 'en-KE') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
