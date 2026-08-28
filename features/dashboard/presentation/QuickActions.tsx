import { BarChart3, Building, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui';
import { ROUTES } from '@/lib/routes';

const actions = [
  { label: 'New Invoice', icon: FileText, href: ROUTES.createInvoice, className: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/50' },
  { label: 'Add Expense', icon: CreditCard, href: ROUTES.createExpense, className: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/50' },
  { label: 'Reports', icon: BarChart3, href: ROUTES.reports, className: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-950/50' },
  { label: 'Business', icon: Building, href: ROUTES.business, className: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/50' },
] as const;

export function QuickActions({ pendingRoute, onNavigate }: { pendingRoute: string | null; onNavigate: (href: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
      <SectionHeader title="Quick Actions" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ label, icon: Icon, href, className }) => (
          <Link key={href} href={href} onClick={() => onNavigate(href)} className={`group flex flex-col items-center gap-3 rounded-xl border px-4 py-5 text-center transition-all duration-200 ${className} ${pendingRoute === href ? 'pointer-events-none opacity-60' : 'hover:shadow-md'}`}>
            <Icon aria-hidden="true" className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="line-clamp-2 text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
