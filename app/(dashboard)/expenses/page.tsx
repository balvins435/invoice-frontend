'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Filter, Download, Edit, Trash2,
  TrendingDown, PieChart, Tag, X, ChevronDown,
  AlertTriangle, ReceiptText,
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { Expense, ExpenseFilters, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// ── helpers ───────────────────────────────────────────────────────────────────
const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') { const p = parseFloat(v); return Number.isFinite(p) ? p : 0; }
  return 0;
};

const exportCSV = (rows: Expense[]) => {
  const data = [
    ['Title', 'Category', 'Amount', 'Date', 'Tax Deductible'],
    ...rows.map(e => [e.title, e.category, e.amount, e.expense_date, e.tax_deductible ? 'Yes' : 'No']),
  ];
  const blob = new Blob([data.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link); link.click(); link.remove();
  toast.success('Expenses exported');
};

// ── select wrapper ────────────────────────────────────────────────────────────
const SelectField = ({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
    </div>
  </div>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses]               = useState<Expense[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [searchQuery, setSearchQuery]         = useState('');
  const [filters, setFilters]                 = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters]         = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingRoute, setPendingRoute]       = useState<string | null>(null);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => { fetchExpenses(); }, [filters]);
  useEffect(() => { router.prefetch('/expenses/create'); }, [router]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res     = await apiService.expenses.getAll(filters);
      const payload = res.data;
      setExpenses(Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []);
    } catch { toast.error('Failed to load expenses'); }
    finally  { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await apiService.expenses.delete(selectedExpense.id);
      toast.success('Expense deleted');
      fetchExpenses();
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch { toast.error('Failed to delete expense'); }
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount    = expenses.reduce((s, e) => s + toNumber(e.amount), 0);
  const deductible     = expenses.filter(e => e.tax_deductible).reduce((s, e) => s + toNumber(e.amount), 0);
  const nonDeductible  = expenses.filter(e => !e.tax_deductible).reduce((s, e) => s + toNumber(e.amount), 0);
  const byCategory     = filtered.reduce((acc, e) => {
    if (!acc[e.category]) {
      acc[e.category] = { total: 0, deductible: 0 };
    }
    const amount = toNumber(e.amount);
    acc[e.category].total += amount;
    if (e.tax_deductible) acc[e.category].deductible += amount;
    return acc;
  }, {} as Record<string, { total: number; deductible: number }>);

  const categoryEntries = Object.entries(byCategory)
    .map(([category, data]) => ({
      category,
      total: data.total,
      deductibleRatio: data.total > 0 ? data.deductible / data.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategories = categoryEntries.slice(0, 6);
  const categoryCount = Object.keys(byCategory).length;
  const categoryTotalAmount = categoryEntries.reduce((sum, entry) => sum + entry.total, 0);

  const categoryChartData = React.useMemo(() => {
    if (!categoryEntries.length) return null;

    const maxSlices = 8;
    const sliced = categoryEntries.slice(0, maxSlices);
    const remainder = categoryEntries.slice(maxSlices);
    const remainderTotal = remainder.reduce((sum, entry) => sum + entry.total, 0);
    const remainderDeductible = remainder.reduce((sum, entry) => sum + (entry.total * entry.deductibleRatio), 0);

    const labels = sliced.map((entry) => EXPENSE_CATEGORIES[entry.category as ExpenseCategory] || entry.category);
    const values = sliced.map((entry) => entry.total);
    const ratios = sliced.map((entry) => entry.deductibleRatio);

    if (remainderTotal > 0) {
      labels.push('Other');
      values.push(remainderTotal);
      ratios.push(remainderTotal > 0 ? remainderDeductible / remainderTotal : 0);
    }

    const deductiblePalette = ['#10b981', '#22c55e', '#14b8a6', '#0ea5e9'];
    const nonDeductiblePalette = ['#f59e0b', '#f97316', '#ef4444', '#fb7185'];
    let deductibleIndex = 0;
    let nonDeductibleIndex = 0;

    const colors = ratios.map((ratio) => {
      if (ratio >= 0.5) {
        const color = deductiblePalette[deductibleIndex % deductiblePalette.length];
        deductibleIndex += 1;
        return color;
      }
      const color = nonDeductiblePalette[nonDeductibleIndex % nonDeductiblePalette.length];
      nonDeductibleIndex += 1;
      return color;
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [categoryEntries]);

  const isCreatePending = pendingRoute === '/expenses/create' && pathname !== '/expenses/create';

  return (
    <>
      <Navbar title="Expenses" subtitle="Track and manage your business expenses" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Expenses</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and manage your business expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(filtered)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <Link
                href="/expenses/create"
                onClick={() => setPendingRoute('/expenses/create')}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Link>
            </div>
          </div>

          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            {/* Total */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                  <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Expenses</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalAmount)}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{expenses.length} records</p>
              </div>
            </div>

            {/* Deductible */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                  <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">Deductible</span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Tax Deductible</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(deductible)}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {totalAmount > 0 ? ((deductible / totalAmount) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
            </div>

            {/* Non-deductible */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                  <Tag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">Non-deductible</span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Non-Deductible</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(nonDeductible)}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {totalAmount > 0 ? ((nonDeductible / totalAmount) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
            </div>

            {/* Categories — clickable */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
                  <PieChart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-violet-500 dark:text-violet-400 group-hover:underline">View →</span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Categories</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{categoryCount}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">unique categories</p>
              </div>
            </button>
          </div>

          {/* ── Toolbar ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by title, category…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <SelectField
                    label="Category"
                    value={filters.category || ''}
                    onChange={v => setFilters({ ...filters, category: v as ExpenseCategory })}
                  >
                    <option value="">All Categories</option>
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </SelectField>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">From</label>
                    <Input type="date" value={filters.date_from || ''} onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">To</label>
                    <Input type="date" value={filters.date_to || ''} onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
                  </div>

                  <SelectField
                    label="Tax Status"
                    value={filters.tax_deductible === undefined ? '' : String(filters.tax_deductible)}
                    onChange={v => setFilters({ ...filters, tax_deductible: v === '' ? undefined : v === 'true' })}
                  >
                    <option value="">All</option>
                    <option value="true">Deductible Only</option>
                    <option value="false">Non-Deductible Only</option>
                  </SelectField>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({})}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white" />
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading expenses…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <ReceiptText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {searchQuery ? 'No expenses match your search' : 'No expenses yet'}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {searchQuery ? 'Try a different query' : 'Add your first expense to get started'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/expenses/create"
                    onClick={() => setPendingRoute('/expenses/create')}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Expense
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Date', 'Title', 'Category', 'Amount', 'Tax Status', ''].map(h => (
                        <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map(expense => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                          {formatDate(expense.expense_date)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{expense.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {EXPENSE_CATEGORIES[expense.category as ExpenseCategory] || expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4">
                          {expense.tax_deductible ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Deductible
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                              Not Deductible
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/expenses/${expense.id}/edit`}>
                              <button
                                title="Edit"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => { setSelectedExpense(expense); setShowDeleteModal(true); }}
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Category breakdown modal ── */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Expense Categories" size="lg">
        <div className="space-y-5">

          {/* Chart */}
          <div className="h-56 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
            {categoryChartData ? (
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = Number(context.parsed || 0);
                          const pct = categoryTotalAmount > 0 ? (value / categoryTotalAmount) * 100 : 0;
                          return `${context.label}: ${formatCurrency(value)} (${pct.toFixed(1)}%)`;
                        },
                      },
                    },
                  },
                  cutout: '55%',
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                No category data available
              </div>
            )}
          </div>

          {/* Category rows */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Breakdown</p>
            {topCategories.map((entry) => {
              const pct = categoryTotalAmount > 0 ? (entry.total / categoryTotalAmount) * 100 : 0;
              return (
                <div key={entry.category}>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {EXPENSE_CATEGORIES[entry.category as ExpenseCategory] || entry.category}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(entry.total)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-5 py-4">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Total Expenses</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(categoryTotalAmount)}
            </span>
          </div>
        </div>
      </Modal>

      {/* ── Delete modal ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Expense">
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">This action is permanent</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                <span className="font-semibold">{selectedExpense?.title}</span> will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 dark:bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Expense
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
