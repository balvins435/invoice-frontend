'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { Business, Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const getInvoiceBusinessId = (invoice: Invoice | null): number | null => {
  if (!invoice) return null;
  const candidate = invoice.business_id ?? invoice.business;
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
};

const getBusinessLabel = (business: Business | null): string =>
  business?.display_name || business?.business_name || 'Unknown business';

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    businesses,
    activeBusinessId,
    setActiveBusinessId,
  } = useActiveBusiness();

  const invoiceBusinessId = getInvoiceBusinessId(invoice);
  const invoiceBusiness = useMemo(
    () => businesses.find((business) => business.id === invoiceBusinessId) || null,
    [businesses, invoiceBusinessId]
  );
  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) || null,
    [activeBusinessId, businesses]
  );
  const invoiceBusinessLabel = getBusinessLabel(invoiceBusiness);
  const activeBusinessLabel = getBusinessLabel(activeBusiness);
  const showBusinessMismatch = Boolean(
    invoiceBusinessId &&
    activeBusinessId &&
    invoiceBusinessId !== activeBusinessId
  );

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        if (!invoiceId) {
          setError('Invoice ID is missing.');
          return;
        }
        const response = await apiService.invoices.getById(Number(invoiceId));
        setInvoice(response.data);
        setError(null);
      } catch {
        setError('Failed to load invoice.');
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      setIsLoading(false);
      setError('Invoice ID is missing.');
    }
  }, [invoiceId]);

  const handleSyncBusinessContext = () => {
    if (!invoiceBusinessId) return;
    setActiveBusinessId(invoiceBusinessId);
    toast.success(`Active business set to ${invoiceBusinessLabel}`);
  };

  return (
    <>
      <Navbar title="Invoice Details" subtitle="Review invoice status and payments" />

      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href={ROUTES.invoices}
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

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Business Context</p>
                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                          {invoiceBusinessLabel}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {invoiceBusiness
                            ? `This invoice is filed under ${invoiceBusinessLabel}.`
                            : invoiceBusinessId
                              ? `This invoice belongs to business #${invoiceBusinessId}.`
                              : 'Business information is unavailable for this invoice.'}
                        </p>
                      </div>
                    </div>

                    {showBusinessMismatch ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 sm:max-w-xs">
                        <p className="font-semibold">Active business differs</p>
                        <p className="mt-1 text-xs leading-5">
                          You are viewing {invoiceBusinessLabel}, but the current app context is {activeBusinessLabel}.
                        </p>
                        <button
                          type="button"
                          onClick={handleSyncBusinessContext}
                          className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Switch Active Business
                        </button>
                      </div>
                    ) : null}
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
