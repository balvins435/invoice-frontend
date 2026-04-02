'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { apiService } from '@/lib/api';
import { openAiChatShortcut } from '@/lib/ai';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
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

const BusinessStateCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
      <Building2 className="h-6 w-6 text-gray-500 dark:text-gray-300" />
    </div>
    <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </section>
);

export default function TaxPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [submissions, setSubmissions] = useState<TaxSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');

  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    hasBusinesses,
    requiresSelection,
    isLoading: isBusinessLoading,
    error: businessError,
  } = useActiveBusiness();

  const businessName = activeBusiness?.display_name || activeBusiness?.business_name;
  const showBusinessSelector = businesses.length > 1;

  const unsyncedInvoices = useMemo(
    () => invoices.filter((invoice) => !invoice.tax_invoice_number),
    [invoices]
  );

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  const syncSelectedInvoice = useCallback((invoiceList: Invoice[]) => {
    const firstUnsynced = invoiceList.find((item) => !item.tax_invoice_number);
    const selectedInvoice =
      invoiceList.find((item) => String(item.id) === invoiceId && !item.tax_invoice_number) || firstUnsynced;

    if (!selectedInvoice) {
      setInvoiceId('');
      return;
    }

    setInvoiceId(String(selectedInvoice.id));
  }, [invoiceId]);

  const loadData = useCallback(async () => {
    if (isBusinessLoading) return;

    if (!hasBusinesses || requiresSelection) {
      setInvoices([]);
      setSubmissions([]);
      setInvoiceId('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = activeBusinessId ? { business_id: activeBusinessId } : undefined;
      const [invoiceRes, submissionRes] = await Promise.all([
        apiService.invoices.getAll(params),
        apiService.tax.getSubmissions(params),
      ]);
      const invoiceList = parseList<Invoice>(invoiceRes.data);
      const submissionList = parseList<TaxSubmission>(submissionRes.data);
      setInvoices(invoiceList);
      setSubmissions(submissionList);
      syncSelectedInvoice(invoiceList);
    } catch {
      toast.error('Failed to load tax data');
    } finally {
      setIsLoading(false);
    }
  }, [activeBusinessId, hasBusinesses, isBusinessLoading, requiresSelection, syncSelectedInvoice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleAskAiAboutTax = () => {
    openAiChatShortcut({
      open: true,
      mode: 'report',
      prompt: businessName
        ? `Summarize the current eTIMS sync status for ${businessName}. Highlight submitted invoices, failures, likely causes, and the top actions needed next.`
        : 'Summarize the current eTIMS sync status. Highlight submitted invoices, failures, likely causes, and the top actions needed next.',
    });
  };

  const handleExplainEtimsFailure = (submission: TaxSubmission) => {
    openAiChatShortcut({
      open: true,
      mode: 'general',
      prompt: `Explain this eTIMS submission failure and suggest the next fix. Invoice: ${submission.invoice_number || `#${submission.invoice}`}. Status: ${submission.status}. Error: ${submission.error_message || 'No error message returned'}.`,
    });
  };

  return (
    <>
      <Navbar title="Tax (eTIMS)" subtitle="Submit invoices to KRA eTIMS and track tax invoice numbers" />

      <main className="min-h-screen bg-gray-50/60 p-6 transition-colors duration-200 dark:bg-gray-950 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Tax (eTIMS)</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Submit invoice payloads to KRA eTIMS and track tax invoice numbers.</p>
                {businessName ? (
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Showing <span className="text-gray-900 dark:text-white">{businessName}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {showBusinessSelector ? (
                  <ActiveBusinessSelector
                    businesses={businesses}
                    activeBusinessId={activeBusinessId}
                    onChange={setActiveBusinessId}
                    helperText="Invoice options and eTIMS submission history will follow the selected company."
                    className="w-full sm:w-[320px]"
                  />
                ) : null}
                <button
                  onClick={handleAskAiAboutTax}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <Sparkles className="h-4 w-4" /> Ask AI
                </button>
                <button
                  onClick={loadData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
            </div>
          </section>

          {!hasBusinesses && !isBusinessLoading ? (
            <BusinessStateCard
              title="Create a business first"
              description="Tax submissions are tied to invoices, and invoices belong to a business. Add a company profile first so eTIMS submissions and tax invoice numbers stay attached to the right ledger."
            />
          ) : requiresSelection ? (
            <BusinessStateCard
              title="Select a business to continue"
              description="You have more than one business. Pick the active company first so invoice options and eTIMS submissions stay in the same business context."
            />
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit Invoice to eTIMS</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send invoice payload, receive tax invoice number, attach to invoice</p>
                </div>

                <form onSubmit={submitToEtims} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                    <select
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-gray-900"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit to eTIMS'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
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
                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                          <th className="px-6 py-3">Invoice</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Tax Invoice #</th>
                          <th className="px-6 py-3">Submitted</th>
                          <th className="px-6 py-3">Error</th>
                          <th className="px-6 py-3">AI</th>
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
                            <td className="px-6 py-3">
                              {submission.status === 'failed' ? (
                                <button
                                  type="button"
                                  onClick={() => handleExplainEtimsFailure(submission)}
                                  className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-xs font-medium text-fuchsia-700 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
                                >
                                  Explain Failure
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
