'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building,
  CreditCard,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { apiService } from '@/lib/api';
import { Expense, Invoice } from '@/types';
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils';

// Format large numbers with abbreviations (K, M, B)
const formatCompactNumber = (value: number, currency: string = 'Ksh'): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    return `${currency} ${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${currency} ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value, currency);
};

// Determine font size based on number of characters in formatted value
const getFontSizeClass = (value: string): string => {
  const length = value.length;
  if (length > 20) return 'text-lg';
  if (length > 15) return 'text-xl';
  if (length > 12) return 'text-2xl';
  return 'text-3xl';
};

const parseList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === 'object' &&
    'results' in payload &&
    Array.isArray((payload as { results?: unknown }).results)
  ) {
    return (payload as { results: T[] }).results;
  }
  return [];
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
    sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30',
    draft: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] || colors.draft}`}>
      {getStatusText(status)}
    </span>
  );
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    ['/invoices', '/expenses', '/invoices/create', '/expenses/create', '/reports', '/business']
      .forEach((href) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const businessRes = await apiService.business.getAll();
        const businesses = parseList<{ id: number }>(businessRes.data);
        const businessIds = businesses.map((business) => business.id);

        const [invoiceRes, expenseRes] = await Promise.all([
          apiService.invoices.getAll(),
          apiService.expenses.getAll(),
        ]);

        const allInvoices = parseList<Invoice>(invoiceRes.data);
        const allExpenses = parseList<Expense>(expenseRes.data);

        setInvoices(allInvoices);
        setExpenses(
          businessIds.length
            ? allExpenses.filter((expense) => businessIds.includes(expense.business))
            : allExpenses
        );
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalIncome = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0),
    [invoices]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0),
    [expenses]
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'sent').length,
    [invoices]
  );
  const totalClients = useMemo(
    () => new Set(invoices.map((invoice) => (invoice.client_email || invoice.client_name).toLowerCase())).size,
    [invoices]
  );

  const netProfit = totalIncome - totalExpenses;

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [invoices]
  );
  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [expenses]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4 sm:space-y-6">
          <div className="h-8 w-52 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overview</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A live snapshot of income, expenses, and client activity.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/expenses/create"
                onClick={() => setPendingRoute('/expenses/create')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <CreditCard className="h-4 w-4" /> Add Expense
              </Link>
              <Link
                href="/invoices/create"
                onClick={() => setPendingRoute('/invoices/create')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" /> New Invoice
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-950/40"><TrendingUp className="h-4 w-4 text-emerald-600" /></span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Total Income</p>
            <p className={`mt-1 font-bold text-slate-900 dark:text-white ${getFontSizeClass(formatCompactNumber(totalIncome))}`}>{formatCompactNumber(totalIncome)}</p>
            <p className="mt-1 text-xs text-slate-500">From paid invoices</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-red-50 p-2.5 dark:bg-red-950/40"><TrendingDown className="h-4 w-4 text-red-500" /></span>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Total Expenses</p>
            <p className={`mt-1 font-bold text-slate-900 dark:text-white ${getFontSizeClass(formatCompactNumber(totalExpenses))}`}>{formatCompactNumber(totalExpenses)}</p>
            <p className="mt-1 text-xs text-slate-500">{expenses.length} recorded</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/40"><FileText className="h-4 w-4 text-amber-600" /></span>
              <span className="text-xs font-semibold text-amber-600">{pendingInvoices}</span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Pending Invoices</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{pendingInvoices}</p>
            <p className="mt-1 text-xs text-slate-500">Awaiting payment</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-950/40"><Users className="h-4 w-4 text-blue-600" /></span>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Clients</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{totalClients}</p>
            <p className="mt-1 text-xs text-slate-500">Unique clients</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${netProfit >= 0 ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20' : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Profit</p>
            <p className={`mt-2 font-bold ${getFontSizeClass(formatCompactNumber(netProfit))} ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatCompactNumber(netProfit)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {netProfit >= 0 ? 'Profitable period' : 'Operating at a loss'}
            </p>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'New Invoice', icon: FileText, href: '/invoices/create', tone: 'blue' },
                { label: 'Add Expense', icon: CreditCard, href: '/expenses/create', tone: 'emerald' },
                { label: 'Reports', icon: BarChart3, href: '/reports', tone: 'violet' },
                { label: 'Business', icon: Building, href: '/business', tone: 'amber' },
              ].map(({ label, icon: Icon, href, tone }) => {
                const toneMap: Record<string, string> = {
                  blue: 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-300',
                  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-300',
                  violet: 'bg-violet-50 border-violet-100 text-violet-700 dark:bg-violet-950/30 dark:border-violet-900/30 dark:text-violet-300',
                  amber: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-300',
                };
                const isPending = pendingRoute === href && pathname !== href;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setPendingRoute(href)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center text-xs font-medium transition sm:text-sm ${toneMap[tone]} ${isPending ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="line-clamp-2">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-start justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Invoices</p>
              <Link href="/invoices" onClick={() => setPendingRoute('/invoices')} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentInvoices.length ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex flex-col gap-2 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.invoice_number}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{invoice.client_name} · {formatDate(invoice.issue_date)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCompactNumber(toNumber(invoice.total_amount), invoice.currency)}
                      </p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">No invoices yet.</div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-start justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Expenses</p>
              <Link href="/expenses" onClick={() => setPendingRoute('/expenses')} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentExpenses.length ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex flex-col gap-2 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{expense.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{expense.category} · {formatDate(expense.expense_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCompactNumber(toNumber(expense.amount))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">No expenses yet.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
