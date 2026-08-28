import { ArrowRight, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';

import { Badge, SectionHeader } from '@/components/ui';
import { ROUTES } from '@/lib/routes';
import { formatDate, getStatusText } from '@/lib/utils';
import { Expense, Invoice } from '@/types';
import { formatCompactMoney, toFiniteNumber } from '../domain/dashboard';

const statusVariant = (status: string) => status === 'paid' ? 'success' : status === 'sent' ? 'default' : status === 'partial' ? 'warning' : 'secondary';

function PanelHeader({ title, href, onNavigate }: { title: string; href: string; onNavigate: (href: string) => void }) {
  return <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center"><SectionHeader title={title} /><Link href={href} onClick={() => onNavigate(href)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">View all <ArrowRight aria-hidden="true" className="h-3 w-3" /></Link></div>;
}

export function RecentActivity({ invoices, expenses, onNavigate }: { invoices: Invoice[]; expenses: Expense[]; onNavigate: (href: string) => void }) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader title="Recent Invoices" href={ROUTES.invoices} onNavigate={onNavigate} />
        {invoices.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{invoices.map((invoice, index) => <div key={invoice.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.invoice_number}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{invoice.client_name} • {formatDate(invoice.issue_date)}</p></div></div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCompactMoney(toFiniteNumber(invoice.total_amount), invoice.currency || 'KES')}</p><Badge variant={statusVariant(invoice.status)}>{getStatusText(invoice.status)}</Badge></div></div>)}</div> : <div className="py-12 text-center"><FileText aria-hidden="true" className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-700" /><p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet</p></div>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader title="Recent Expenses" href={ROUTES.expenses} onNavigate={onNavigate} />
        {expenses.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{expenses.map((expense, index) => <div key={expense.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{expense.title}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{expense.category} • {formatDate(expense.expense_date)}</p></div></div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCompactMoney(toFiniteNumber(expense.amount))}</p></div>)}</div> : <div className="py-12 text-center"><CreditCard aria-hidden="true" className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-700" /><p className="text-sm text-slate-500 dark:text-slate-400">No expenses yet</p></div>}
      </div>
    </section>
  );
}
