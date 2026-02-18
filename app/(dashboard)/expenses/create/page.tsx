'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, TrendingDown, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { apiService } from '@/lib/api';
import { Business } from '@/types';
import toast from 'react-hot-toast';

export default function CreateExpensePage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiService.business.getAll();
        setBusinesses(res.data.results || res.data);
      } catch { toast.error('Failed to load businesses'); }
    };
    fetch();
  }, []);

  const handleSuccess = () => router.push('/expenses');
  const handleCancel  = () => router.back();

  return (
    <>
      <Navbar
        title="Add Expense"
        subtitle="Record a new business expense and attach receipts"
      />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* ── Header bar ── */}
          <div className="flex items-center justify-between">
            <Link
              href="/expenses"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Expenses
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/expenses"
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                form="expense-form"
                className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                Save Expense
              </button>
            </div>
          </div>

          {/* ── Main content grid ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Left — Form (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 lg:p-8">
                <ExpenseForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                  businesses={businesses}
                  selectedBusinessId={selectedBusinessId}
                  onBusinessChange={setSelectedBusinessId}
                />
              </div>
            </div>

            {/* Right — Sidebar (1/3 width) */}
            <div className="space-y-4">

              {/* Checklist card */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Expense Checklist</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Before you save</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Correct category selected', icon: Receipt, color: 'emerald' },
                    { label: 'Amount and date filled in', icon: TrendingDown, color: 'blue' },
                    { label: 'Receipt attached (optional)', icon: CheckCircle2, color: 'violet' },
                  ].map(({ label, icon: Icon, color }) => {
                    const colorMap: Record<string, string> = {
                      emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
                      blue:    'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
                      violet:  'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
                    };
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                      </div>
                    );
                  })}
                  <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Attaching receipts is optional but recommended for clean records and audits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax tips card */}
              <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                    <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Tax Tips</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <li>· Keep digital receipts for easier tracking</li>
                      <li>· Mark tax-deductible expenses correctly</li>
                      <li>· Record expenses close to transaction date</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </>
  );
}