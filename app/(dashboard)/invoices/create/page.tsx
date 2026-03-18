'use client';

import React from 'react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ROUTES } from '@/lib/routes';
import { InvoiceForm } from './components/InvoiceForm';

export default function CreateInvoicePage() {
  return (
    <>
      <Navbar
        title="Create Invoice"
        subtitle="Fill in the details to generate a professional invoice"
      />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ── Header bar ── */}
          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.invoices}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.invoices}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                form="invoice-form"
                className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                Create Invoice
              </button>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 lg:p-8">
            <InvoiceForm />
          </div>

          {/* ── Tips ── */}
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Invoice Tips</p>
                <ul className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-400">
                  <li>· Add clear item descriptions to avoid client confusion</li>
                  <li>· Set a reasonable due date — typically 14–30 days</li>
                  <li>· VAT is auto-calculated from your Business settings</li>
                  <li>· Save as draft first and review before sending</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
