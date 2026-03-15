'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.invoices.getById(Number(params.id));
        setInvoice(response.data);
        setError(null);
      } catch {
        setError('Failed to load invoice.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  return (
    <>
      <Navbar title="Invoice Details" subtitle="Review invoice status and payments" />

      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              Loading invoice...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : invoice ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Invoice</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {invoice.invoice_number}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{invoice.client_name}</p>
                    <p className="text-xs text-slate-500">{invoice.client_email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Status: {invoice.status}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Amount Paid</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(invoice.amount_paid ?? 0, invoice.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Balance Due</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(invoice.balance_due ?? 0, invoice.currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">Issue Date</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">Due Date</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <FileText className="h-4 w-4" />
                  Line Items
                </div>
                <div className="mt-4 space-y-3">
                  {invoice.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.total, invoice.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
