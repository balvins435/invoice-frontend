'use client';

import { CreditCard, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { EmptyState, ErrorState, LoadingState, Page } from '@/components/ui';
import { ROUTES } from '@/lib/routes';
import { useDashboard } from '../application/useDashboard';
import { DashboardSummary, NetProfitCard } from './DashboardSummary';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

const prefetchedRoutes = [ROUTES.invoices, ROUTES.expenses, ROUTES.createInvoice, ROUTES.createExpense, ROUTES.reports, ROUTES.business];

export function DashboardScreen() {
  const dashboard = useDashboard();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    prefetchedRoutes.forEach((href) => router.prefetch(href));
  }, [router]);

  if (dashboard.isInitialLoading) {
    return <Page><LoadingState title="Loading dashboard" description="Fetching your latest business totals." /></Page>;
  }
  if (dashboard.error) {
    return <Page><ErrorState title="Could not load businesses" description="We could not determine your active business." onAction={dashboard.refresh} /></Page>;
  }
  if (!dashboard.hasBusinesses) {
    return <Page><EmptyState title="Create your first business" description="Add a business profile before viewing invoices, expenses, and reports." action={<Link href={ROUTES.business} className="btn-primary">Create business</Link>} /></Page>;
  }

  const businessName = dashboard.activeBusiness?.display_name || dashboard.activeBusiness?.business_name || 'business';
  const navigate = (href: string) => setPendingRoute(href);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-6 dark:from-slate-950 dark:to-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-8 lg:space-y-10">
        <header className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-end">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Track income, expenses, and client activity for one business at a time.</p>
            {dashboard.activeBusiness ? <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Viewing <span className="text-slate-900 dark:text-white">{businessName}</span></p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            <ActiveBusinessSelector businesses={dashboard.businesses} activeBusinessId={dashboard.activeBusinessId} onChange={dashboard.setActiveBusinessId} helperText={dashboard.businesses.length > 1 ? 'Switch the active business here. The same selection is reused across the app.' : undefined} className="w-full xl:w-[320px]" />
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Link href={ROUTES.createExpense} onClick={() => navigate(ROUTES.createExpense)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:flex-none"><CreditCard aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">Add Expense</span><span className="sm:hidden">Expense</span></Link>
              <Link href={ROUTES.createInvoice} onClick={() => navigate(ROUTES.createInvoice)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:flex-none"><Plus aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">New Invoice</span><span className="sm:hidden">Invoice</span></Link>
            </div>
          </div>
        </header>

        {dashboard.requiresSelection ? (
          <EmptyState title="Select a business to view the dashboard" description="You have more than one company. Pick the active business above so dashboard totals, recent invoices, and expenses all refer to the same ledger." />
        ) : (
          <>
            <DashboardSummary metrics={dashboard.metrics} />
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <NetProfitCard metrics={dashboard.metrics} />
              <QuickActions pendingRoute={pendingRoute} onNavigate={navigate} />
            </section>
            <RecentActivity invoices={dashboard.metrics.recentInvoices} expenses={dashboard.metrics.recentExpenses} onNavigate={navigate} />
          </>
        )}
      </div>
    </main>
  );
}
