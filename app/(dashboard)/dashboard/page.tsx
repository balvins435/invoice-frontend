'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Landmark,
  CreditCard,
  FileText,
  Users,
  Plus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';
import { Expense, Invoice } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'results' in payload &&
    Array.isArray((payload as { results?: unknown }).results)) {
    return (payload as { results: T[] }).results;
  }
  return [];
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const p = Number.parseFloat(value);
    return Number.isFinite(p) ? p : 0;
  }
  return 0;
};

const formatKsh = (amount: number) =>
  `Ksh ${toNumber(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const colors: Record<string, string> = {
    paid:    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    sent:    'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    draft:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
    overdue: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  };
  return (
    <span className={`${base} ${colors[status] ?? colors.draft}`}>
      {getStatusText(status)}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
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
        const businessIds = businesses.map((b) => b.id);

        const [invoiceRes, expenseRes] = await Promise.all([
          apiService.invoices.getAll(),
          apiService.expenses.getAll(),
        ]);

        const allInvoices = parseList<Invoice>(invoiceRes.data);
        const allExpenses = parseList<Expense>(expenseRes.data);

        setInvoices(allInvoices);
        setExpenses(businessIds.length
          ? allExpenses.filter((e) => businessIds.includes(e.business))
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

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalIncome   = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + toNumber(i.total_amount), 0), [invoices]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + toNumber(e.amount), 0), [expenses]);
  const pendingCount  = useMemo(() => invoices.filter((i) => i.status === 'sent').length, [invoices]);
  const clientCount   = useMemo(() => new Set(invoices.map((i) => (i.client_email || i.client_name).toLowerCase())).size, [invoices]);
  const netProfit     = totalIncome - totalExpenses;

  const recentInvoices = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [invoices]
  );
  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [expenses]
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
          <div className="h-7 w-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}
          </div>
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-72 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/expenses/create"
              onClick={() => setPendingRoute('/expenses/create')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <CreditCard className="h-4 w-4" />
              Add Expense
            </Link>
            <Link
              href="/invoices/create"
              onClick={() => setPendingRoute('/invoices/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Income */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Income</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatKsh(totalIncome)}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">from paid invoices</p>
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Expenses</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatKsh(totalExpenses)}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{expenses.length} recorded</p>
            </div>
          </div>

          {/* Pending invoices */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className={`text-xs font-bold tabular-nums ${
                pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600'
              }`}>
                {pendingCount > 0 ? `+${pendingCount}` : '—'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Pending</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{pendingCount}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">awaiting payment</p>
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Clients</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{clientCount}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">unique clients</p>
            </div>
          </div>
        </div>

        {/* ── Net profit banner + quick actions ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Net profit */}
          <div className={`rounded-2xl border p-5 shadow-sm ${
            netProfit >= 0
              ? 'border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20'
              : 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Net Profit
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${
              netProfit >= 0
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatKsh(netProfit)}
            </p>
            <p className={`mt-1 text-xs ${
              netProfit >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-500 dark:text-red-400'
            }`}>
              {netProfit >= 0 ? 'Profitable period' : 'Operating at a loss'}
            </p>
          </div>

          {/* Quick actions */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'New Invoice',      icon: FileText,  href: '/invoices/create', accent: 'blue'   },
                { label: 'Add Expense',      icon: CreditCard,href: '/expenses/create', accent: 'emerald'},
                { label: 'View Reports',     icon: BarChart3, href: '/reports',          accent: 'violet' },
                { label: 'Business',         icon: Landmark,  href: '/business',         accent: 'amber'  },
              ].map(({ label, icon: Icon, href, accent }) => {
                const accentMap: Record<string, string> = {
                  blue:    'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50',
                  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
                  violet:  'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/50',
                  amber:   'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50',
                };
                const isPending = pendingRoute === href && pathname !== href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setPendingRoute(href)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center text-sm font-medium transition-colors ${accentMap[accent]} ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Recent Invoices */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Invoices</p>
              <Link
                href="/invoices"
                onClick={() => setPendingRoute('/invoices')}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentInvoices.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {invoice.invoice_number}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
                        {invoice.client_name} · {formatDate(invoice.issue_date)}
                      </p>
                    </div>
                    <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No invoices yet</p>
                <Link
                  href="/invoices/create"
                  onClick={() => setPendingRoute('/invoices/create')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Invoice
                </Link>
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Expenses</p>
              <Link
                href="/expenses"
                onClick={() => setPendingRoute('/expenses')}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {expense.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
                        {expense.category} · {formatDate(expense.expense_date)}
                      </p>
                    </div>
                    <p className="ml-4 shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No expenses yet</p>
                <Link
                  href="/expenses/create"
                  onClick={() => setPendingRoute('/expenses/create')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Expense
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}