'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';

export const MobileExpenseForm: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating action button (mobile only) ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* ── Bottom sheet modal ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 transition-opacity md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl md:hidden">

            {/* Handle */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form content (scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <ExpenseForm
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};