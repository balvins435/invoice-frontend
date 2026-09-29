'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { InvoiceForm } from '../../create/components/InvoiceForm';

const getApiErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Failed to load invoice.';
  }
  const data = (error as { response?: { data?: { detail?: string } } }).response?.data;
  return data?.detail || 'Failed to load invoice.';
};

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setIsLoading(false);
      setError('Invoice ID is missing.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await apiService.invoices.getById(Number(invoiceId));
      setInvoice(response.data);
      setError(null);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => { loadInvoice(); }, [loadInvoice]);

  const isEditable = invoice?.status === 'draft';

  return (
    <>
      <Navbar
        title={isEditable ? 'Edit Draft Invoice' : 'Invoice Locked'}
        subtitle={isEditable ? 'Change line items, dates, client details, and the invoice design' : 'Only draft invoices can be edited'}
      />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-5xl space-y-6">

          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.invoices}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Link>
            {isEditable ? (
              <div className="flex items-center gap-2">
                <Link
                  href={ROUTES.invoiceDetail(invoice!.id)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  form="invoice-edit-form"
                  className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              Loading invoice...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : invoice && isEditable ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Draft</p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-500">{invoice.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Current total</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 lg:p-8">
                <InvoiceForm key={invoice.id} invoice={invoice} />
              </div>
            </>
          ) : invoice ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Lock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {invoice.invoice_number} is {invoice.status} and can no longer be edited
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Your client already holds a copy of this invoice, so line items and totals are frozen. Create a new invoice if something needs to change.
                  </p>
                  <Link
                    href={ROUTES.invoiceDetail(invoice.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Back to invoice
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </main>
    </>
  );
}
