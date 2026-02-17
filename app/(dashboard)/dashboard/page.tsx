'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/StatCard';
import { 
  Landmark, 
  CreditCard, 
  FileText, 
  Users,
  Plus,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';
import { Expense, Invoice } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const businessRes = await apiService.business.getAll();
        const businesses = parseList<{ id: number }>(businessRes.data);
        const businessIds = businesses.map((b) => b.id);

        const [invoiceRes, expenseRes] = await Promise.all([
          apiService.invoices.getAll(),
          apiService.expenses.getAll(),
        ]);

        const fetchedInvoices = parseList<Invoice>(invoiceRes.data);
        const fetchedExpenses = parseList<Expense>(expenseRes.data);

        const filteredExpenses = businessIds.length
          ? fetchedExpenses.filter((expense) => businessIds.includes(expense.business))
          : fetchedExpenses;

        setInvoices(fetchedInvoices);
        setExpenses(filteredExpenses);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalIncome = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0),
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

  const activeClients = useMemo(() => {
    const keys = new Set(
      invoices.map((invoice) => (invoice.client_email || invoice.client_name).toLowerCase())
    );
    return keys.size;
  }, [invoices]);

  const recentInvoices = useMemo(
    () => [...invoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [invoices]
  );

  const recentExpenses = useMemo(
    () => [...expenses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [expenses]
  );

  const formatKsh = (amount: number) =>
    `Ksh ${toNumber(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    {
      title: 'Total Income',
      value: formatKsh(totalIncome),
      icon: Landmark,
      color: 'success' as const,
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: CreditCard,
      color: 'danger' as const,
      formatCurrency: true,
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices,
      icon: FileText,
      color: 'warning' as const,
    },
    {
      title: 'Active Clients',
      value: activeClients,
      icon: Users,
      color: 'primary' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Create Invoice',
      icon: FileText,
      href: '/invoices/create',
      color: 'blue',
    },
    {
      title: 'Add Expense',
      icon: CreditCard,
      href: '/expenses/create',
      color: 'green',
    },
    {
      title: 'View Reports',
      icon: BarChart3,
      href: '/reports',
      color: 'purple',
    },
    {
      title: 'Manage Business',
      icon: Users,
      href: '/business',
      color: 'orange',
    },
  ];

  useEffect(() => {
    [
      '/invoices',
      '/expenses',
      '/invoices/create',
      '/expenses/create',
      '/reports',
      '/business',
    ].forEach((href) => router.prefetch(href));
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to InvoiceTracker! 
              </h2>
              <p className="text-gray-600 mb-4 md:mb-0">
                Start managing your invoices and expenses efficiently. Here&apos;s a quick overview of your business.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/invoices/create"
                onClick={() => setPendingRoute('/invoices/create')}
                className="btn-primary flex items-center"
              >
                {pendingRoute === '/invoices/create' && pathname !== '/invoices/create' ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Invoice
              </Link>
              <Link 
                href="/expenses/create"
                onClick={() => setPendingRoute('/expenses/create')}
                className="btn-secondary flex items-center"
              >
                {pendingRoute === '/expenses/create' && pathname !== '/expenses/create' ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Add Expense
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            formatCurrency={stat.formatCurrency}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                green: 'bg-green-100 text-green-600 border-green-200',
                purple: 'bg-purple-100 text-purple-600 border-purple-200',
                orange: 'bg-orange-100 text-orange-600 border-orange-200',
              };
              
              return (
                <Link
                  key={index}
                  href={action.href}
                  onClick={() => setPendingRoute(action.href)}
                  className={`
                    ${colorClasses[action.color as keyof typeof colorClasses]}
                    border rounded-xl p-6 text-center hover:shadow-md transition-shadow
                    ${pendingRoute === action.href && pathname !== action.href ? 'opacity-80 pointer-events-none' : ''}
                  `}
                >
                  <div className="flex flex-col items-center">
                    {pendingRoute === action.href && pathname !== action.href ? (
                      <Spinner size="sm" className="mb-3" />
                    ) : (
                      <Icon className="h-8 w-8 mb-3" />
                    )}
                    <span className="font-medium">{action.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <Link 
                href="/invoices"
                onClick={() => setPendingRoute('/invoices')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {pendingRoute === '/invoices' && pathname !== '/invoices' ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Loading...
                  </span>
                ) : (
                  'View All'
                )}
              </Link>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-500">{invoice.client_name} . {formatDate(invoice.issue_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent invoices</p>
                <Link 
                  href="/invoices/create"
                  onClick={() => setPendingRoute('/invoices/create')}
                  className="btn-primary mt-4 inline-flex items-center"
                >
                  {pendingRoute === '/invoices/create' && pathname !== '/invoices/create' ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create First Invoice
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
              <Link 
                href="/expenses"
                onClick={() => setPendingRoute('/expenses')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {pendingRoute === '/expenses' && pathname !== '/expenses' ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Loading...
                  </span>
                ) : (
                  'View All'
                )}
              </Link>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                      <p className="text-xs text-gray-500">{expense.category} . {formatDate(expense.expense_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent expenses</p>
                <Link 
                  href="/expenses/create"
                  onClick={() => setPendingRoute('/expenses/create')}
                  className="btn-primary mt-4 inline-flex items-center"
                >
                  {pendingRoute === '/expenses/create' && pathname !== '/expenses/create' ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add First Expense
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
