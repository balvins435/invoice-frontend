'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit, Trash2, Receipt } from 'lucide-react';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types';
import Link from 'next/link';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (expense: Expense) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  compact?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDelete,
  isLoading = false,
  emptyMessage = 'No expenses found',
  showActions = true,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white" />
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading expenses…</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
          <Receipt className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{emptyMessage}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {expense.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span>{EXPENSE_CATEGORIES[expense.category as ExpenseCategory] || expense.category}</span>
                <span>·</span>
                <span>{formatDate(expense.expense_date)}</span>
              </div>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(expense.amount)}
              </p>
              {showActions && (
                <div className="flex items-center gap-1">
                  <Link href={`/expenses/${expense.id}/edit`}>
                    <button
                      title="Edit"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(expense)}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Date
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Title
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Category
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Amount
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Tax Status
              </th>
              {showActions && (
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {/* Actions column header empty */}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                  {formatDate(expense.expense_date)}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {expense.title}
                  </p>
                  {expense.notes && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                      {expense.notes}
                    </p>
                  )}
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
                {showActions && (
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
                      {onDelete && (
                        <button
                          onClick={() => onDelete(expense)}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};