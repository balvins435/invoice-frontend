'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, ShieldCheck } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { Invoice, TaxSubmission } from '@/types';
import { formatDate } from '@/lib/utils';

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

const getApiError = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; error_message?: string } } }).response;
    return response?.data?.error_message || response?.data?.error || fallback;
  }
  return fallback;
};

export default function TaxPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [submissions, setSubmissions] = useState<TaxSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');

  const unsyncedInvoices = useMemo(
    () => invoices.filter((invoice) => !invoice.tax_invoice_number),
    [invoices]
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invoiceRes, submissionRes] = await Promise.all([
        apiService.invoices.getAll(),
        apiService.tax.getSubmissions(),
      ]);
      const invoiceList = parseList<Invoice>(invoiceRes.data);
      const submissionList = parseList<TaxSubmission>(submissionRes.data);
      setInvoices(invoiceList);
      setSubmissions(submissionList);

      if (!invoiceId && invoiceList.length > 0) {
        const target = invoiceList.find((item) => !item.tax_invoice_number);
        if (target) setInvoiceId(String(target.id));
      }
    } catch {
      toast.error('Failed to load tax data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitToEtims = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoiceId) {
      toast.error('Select an invoice first');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiService.tax.submitInvoice({ invoice_id: Number(invoiceId) });
      const taxInvoiceNumber = response?.data?.tax_invoice_number;
      if (taxInvoiceNumber) {
        toast.success(`Submitted to eTIMS. Tax Invoice Number: ${taxInvoiceNumber}`);
      } else {
        toast.success('Invoice submitted to eTIMS');
      }
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiError(error, 'Failed to submit invoice to eTIMS'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar title="Tax (eTIMS)" subtitle="Submit invoices to KRA eTIMS and track tax invoice numbers" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit Invoice to eTIMS</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send invoice payload, receive tax invoice number, attach to invoice</p>
              </div>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            <form onSubmit={submitToEtims} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">Select invoice</option>
                  {unsyncedInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.client_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit to eTIMS'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tax Submissions</h3>
            </div>

            {isLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No tax submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Tax Invoice #</th>
                      <th className="px-6 py-3">Submitted</th>
                      <th className="px-6 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">{submission.invoice_number || `#${submission.invoice}`}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            submission.status === 'submitted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : submission.status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{submission.tax_invoice_number || '-'}</td>
                        <td className="px-6 py-3 text-gray-500">{submission.submitted_at ? formatDate(submission.submitted_at) : '-'}</td>
                        <td className="px-6 py-3 text-red-600">{submission.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
