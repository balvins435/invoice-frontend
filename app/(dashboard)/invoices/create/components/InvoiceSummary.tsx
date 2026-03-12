'use client';

import React, { useMemo } from 'react';
import { Receipt, Percent, Calculator, TrendingUp, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  items: Array<{ description: any; quantity: number; unit_price: number; total: number }>;
  taxRate: number;
}

export const InvoiceSummary: React.FC<Props> = ({ items, taxRate }) => {
  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.total || 0), 0), [items]);
  const tax      = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const total    = useMemo(() => subtotal + tax, [subtotal, tax]);
  const itemCount= useMemo(() => items.filter(i => i.description?.trim?.() !== '').length, [items]);
  const avgItem  = itemCount > 0 ? subtotal / itemCount : 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoice Summary</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Charges and tax breakdown</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          <Percent className="h-3 w-3" />
          VAT {taxRate}%
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Left — calculation breakdown */}
          <div className="space-y-4">

            {/* Line items */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calculator className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Subtotal
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Percent className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    VAT ({taxRate}%)
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatCurrency(tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 px-4 py-3.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Items</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{itemCount}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">line items</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Avg</span>
                </div>
                <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-tight break-words">
                  {formatCurrency(avgItem)}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">per item</p>
              </div>
            </div>
          </div>

          {/* Right — amount due card */}
          <div className="min-w-0 flex flex-col justify-between rounded-2xl bg-gray-900 dark:bg-white p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Amount Due
              </p>
              <p className="mt-3 text-3xl sm:text-4xl font-bold text-white dark:text-gray-900 tabular-nums leading-tight break-words">
                {formatCurrency(total)}
              </p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                incl. {formatCurrency(tax)} VAT
              </p>
            </div>
            <div className="mt-6 space-y-2.5 border-t border-white/10 dark:border-gray-200 pt-5">
              {[
                { label: 'Issue Date', value: 'Today' },
                { label: 'Payment Due', value: '30 days from issue' },
                { label: 'Currency', value: 'KES' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-gray-500">{label}</span>
                  <span className="font-medium text-white dark:text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-6 py-3.5">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          VAT at {taxRate}% is calculated on the subtotal and collected on behalf of the tax authority.
        </p>
      </div>
    </div>
  );
};
