'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building,
  Building2,
  CreditCard,
  FileText,
  Percent,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { MetricCard } from '@/components/ui/MetricCard';
import { apiService } from '@/lib/api';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { DashboardStats } from '@/types';
import { formatDate, getStatusText } from '@/lib/utils';

const formatCompactMoney = (value: number, currency = 'KES', locale = 'en-KE') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {action}
  </div>
);

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
    partial: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] || colors.draft}`}>
      {getStatusText(status)}
    </span>
  );
};

const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Building2 className="h-6 w-6 text-slate-500 dark:text-slate-300" />
    </div>
    <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </section>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    hasBusinesses,
    isLoading: isBusinessLoading,
    requiresSelection,
    error: businessError,
  } = useActiveBusiness();

  const businessName = activeBusiness?.display_name || activeBusiness?.business_name || 'business';

  useEffect(() => {
    [ROUTES.invoices, ROUTES.expenses, ROUTES.createInvoice, ROUTES.createExpense, ROUTES.reports, ROUTES.business]
      .forEach((href) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  const loadDashboard = useCallback(async () => {
    if (isBusinessLoading) return;

    if (!activeBusinessId) {
      setDashboardStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.reports.getDashboardStats({ business_id: activeBusinessId });
      setDashboardStats(response.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, isBusinessLoading]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalIncome = useMemo(() => toNumber(dashboardStats?.total_income), [dashboardStats]);
  const totalExpenses = useMemo(() => toNumber(dashboardStats?.total_expenses), [dashboardStats]);
  const pendingInvoices = useMemo(() => toNumber(dashboardStats?.pending_invoices), [dashboardStats]);
  const totalClients = useMemo(() => toNumber(dashboardStats?.total_clients), [dashboardStats]);
  const netProfit = useMemo(() => toNumber(dashboardStats?.net_profit), [dashboardStats]);
  const recentInvoices = dashboardStats?.recent_invoices || [];
  const recentExpenses = dashboardStats?.recent_expenses || [];

  if ((isBusinessLoading || loading) && !dashboardStats && !requiresSelection && !businessError) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4 sm:space-y-6">
          <div className="h-8 w-52 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-6 dark:from-slate-950 dark:to-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-8 lg:space-y-10">
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-end">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Dashboard</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Track income, expenses, and client activity for one business at a time.
              </p>
              {activeBusiness ? (
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Viewing <span className="text-slate-900 dark:text-white">{businessName}</span>
                </p>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
              <ActiveBusinessSelector
                businesses={businesses}
                activeBusinessId={activeBusinessId}
                onChange={setActiveBusinessId}
                helperText={
                  businesses.length > 1
                    ? 'Switch the active business here. The same selection is reused across the app.'
                    : undefined
                }
                className="w-full xl:w-[320px]"
              />

              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <Link
                  href={ROUTES.createExpense}
                  onClick={() => setPendingRoute(ROUTES.createExpense)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:flex-none"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Expense</span>
                  <span className="sm:hidden">Expense</span>
                </Link>
                <Link
                  href={ROUTES.createInvoice}
                  onClick={() => setPendingRoute(ROUTES.createInvoice)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:flex-none"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Invoice</span>
                  <span className="sm:hidden">Invoice</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {!hasBusinesses && !isBusinessLoading ? (
          <EmptyState
            title="Create a business first"
            description="The dashboard is business-specific by design. Add your first company profile so invoices, expenses, and reports all live under a clear tenant boundary."
            action={
              <Link
                href={ROUTES.business}
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Go to Business Profile
              </Link>
            }
          />
        ) : requiresSelection ? (
          <EmptyState
            title="Select a business to view the dashboard"
            description="You have more than one company. Pick the active business above so dashboard totals, recent invoices, and expenses all refer to the same ledger."
          />
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Income"
                value={totalIncome}
                isCurrency
                subtitle="From paid invoices"
                icon={TrendingUp}
                trend="up"
                tone="emerald"
              />
              <MetricCard
                label="Total Expenses"
                value={totalExpenses}
                isCurrency
                subtitle={`${recentExpenses.length ? 'Recent activity loaded' : 'No recent expenses yet'}`}
                icon={CreditCard}
                trend="down"
                tone="red"
              />
              <MetricCard
                label="Pending Invoices"
                value={pendingInvoices}
                subtitle="Awaiting payment"
                icon={FileText}
                tone="amber"
              />
              <MetricCard
                label="Active Clients"
                value={totalClients}
                subtitle="Unique billed clients"
                icon={Users}
                tone="blue"
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <MetricCard
                label="Net Profit"
                value={netProfit}
                isCurrency
                subtitle={netProfit >= 0 ? 'Profitable period' : 'Operating at a loss'}
                icon={Percent}
                trend={netProfit >= 0 ? 'up' : 'down'}
                tone={netProfit >= 0 ? 'blue' : 'red'}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                <SectionHeader title="Quick Actions" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'New Invoice', icon: FileText, href: ROUTES.createInvoice, tone: 'blue' },
                    { label: 'Add Expense', icon: CreditCard, href: ROUTES.createExpense, tone: 'emerald' },
                    { label: 'Reports', icon: BarChart3, href: ROUTES.reports, tone: 'violet' },
                    { label: 'Business', icon: Building, href: ROUTES.business, tone: 'amber' },
                  ].map(({ label, icon: Icon, href, tone }) => {
                    const toneMap: Record<string, string> = {
                      blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/50',
                      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
                      violet: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-950/50',
                      amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/50',
                    };
                    const isPending = pendingRoute === href && pathname !== href;

                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setPendingRoute(href)}
                        className={`group flex flex-col items-center gap-3 rounded-xl border px-4 py-5 text-center transition-all duration-200 ${toneMap[tone]} ${
                          isPending ? 'pointer-events-none opacity-60' : 'hover:shadow-md'
                        }`}
                      >
                        <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="line-clamp-2 text-xs font-medium">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
                  <SectionHeader title="Recent Invoices" />
                  <Link
                    href={ROUTES.invoices}
                    onClick={() => setPendingRoute(ROUTES.invoices)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentInvoices.length ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentInvoices.map((invoice, idx) => (
                      <div
                        key={invoice.id}
                        className="group flex flex-col gap-3 px-6 py-4 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.invoice_number}</p>
                              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                {invoice.client_name} • {formatDate(invoice.issue_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCompactMoney(toNumber(invoice.total_amount), invoice.currency || 'KES')}
                          </p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
                  <SectionHeader title="Recent Expenses" />
                  <Link
                    href={ROUTES.expenses}
                    onClick={() => setPendingRoute(ROUTES.expenses)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentExpenses.length ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentExpenses.map((expense, idx) => (
                      <div
                        key={expense.id}
                        className="group flex flex-col gap-3 px-6 py-4 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{expense.title}</p>
                              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                {expense.category} • {formatDate(expense.expense_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatCompactMoney(toNumber(expense.amount))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <CreditCard className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No expenses yet</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
