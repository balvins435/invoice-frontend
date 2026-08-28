import { CreditCard, FileText, Percent, TrendingUp, Users } from 'lucide-react';

import { MetricCard } from '@/components/ui';
import { DashboardMetrics } from '../domain/dashboard';

export function DashboardSummary({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Income" value={metrics.totalIncome} isCurrency subtitle="From paid invoices" icon={TrendingUp} trend="up" tone="emerald" />
        <MetricCard label="Total Expenses" value={metrics.totalExpenses} isCurrency subtitle={metrics.recentExpenses.length ? 'Recent activity loaded' : 'No recent expenses yet'} icon={CreditCard} trend="down" tone="red" />
        <MetricCard label="Pending Invoices" value={metrics.pendingInvoices} subtitle="Awaiting payment" icon={FileText} tone="amber" />
        <MetricCard label="Active Clients" value={metrics.totalClients} subtitle="Unique billed clients" icon={Users} tone="blue" />
    </section>
  );
}

export function NetProfitCard({ metrics }: { metrics: DashboardMetrics }) {
  return <MetricCard label="Net Profit" value={metrics.netProfit} isCurrency subtitle={metrics.netProfit >= 0 ? 'Profitable period' : 'Operating at a loss'} icon={Percent} trend={metrics.netProfit >= 0 ? 'up' : 'down'} tone={metrics.netProfit >= 0 ? 'blue' : 'red'} />;
}
