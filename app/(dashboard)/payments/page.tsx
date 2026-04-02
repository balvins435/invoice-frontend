'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, CreditCard, RefreshCw, Sparkles } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { apiService } from '@/lib/api';
import { openAiChatShortcut } from '@/lib/ai';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { Invoice, PaymentTransaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

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
    const response = (error as { response?: { data?: { error?: string; provider_response?: { error?: string } } } }).response;
    return response?.data?.error || response?.data?.provider_response?.error || fallback;
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

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

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

  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== 'paid'),
    [invoices]
  );

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  const syncSelectedInvoice = useCallback((invoiceList: Invoice[]) => {
    const firstUnpaid = invoiceList.find((item) => item.status !== 'paid');
    const selectedInvoice =
      invoiceList.find((item) => String(item.id) === invoiceId && item.status !== 'paid') || firstUnpaid;

    if (!selectedInvoice) {
      setInvoiceId('');
      setAmount('');
      return;
    }

    setInvoiceId(String(selectedInvoice.id));
    setAmount(String(selectedInvoice.balance_due || selectedInvoice.total_amount));
  }, [invoiceId]);

  const loadData = useCallback(async () => {
    if (isBusinessLoading) return;

    if (!hasBusinesses || requiresSelection) {
      setInvoices([]);
      setTransactions([]);
      setInvoiceId('');
      setAmount('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = activeBusinessId ? { business_id: activeBusinessId } : undefined;
      const [invoicesRes, txRes] = await Promise.all([
        apiService.invoices.getAll(params),
        apiService.payments.getTransactions(params),
      ]);

      const invoiceList = parseList<Invoice>(invoicesRes.data);
      const txList = parseList<PaymentTransaction>(txRes.data);

      setInvoices(invoiceList);
      setTransactions(txList);
      syncSelectedInvoice(invoiceList);
    } catch {
      toast.error('Failed to load payments data');
    } finally {
      setIsLoading(false);
    }
  }, [activeBusinessId, hasBusinesses, isBusinessLoading, requiresSelection, syncSelectedInvoice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvoiceChange = (nextInvoiceId: string) => {
    setInvoiceId(nextInvoiceId);
    const selected = invoices.find((item) => item.id === Number(nextInvoiceId));
    setAmount(selected ? String(selected.balance_due || selected.total_amount) : '');
  };

  const initiateStkPush = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoiceId || !phoneNumber.trim()) {
      toast.error('Invoice and phone number are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.payments.initiateStkPush({
        invoice_id: Number(invoiceId),
        phone_number: phoneNumber.trim(),
        ...(amount ? { amount } : {}),
      });
      toast.success('STK push initiated. Ask customer to complete on phone.');
      setPhoneNumber('');
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiError(error, 'Failed to initiate STK push'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAiAboutPayments = () => {
    openAiChatShortcut({
      open: true,
      mode: 'general',
      prompt: businessName
        ? `Review the payment collections for ${businessName}. Summarize failed or pending M-Pesa attempts, likely issues, and the clearest next follow-up actions.`
        : 'Review the payment collections. Summarize failed or pending M-Pesa attempts, likely issues, and the clearest next follow-up actions.',
    });
  };

  const handleExplainFailedCollection = (transaction: PaymentTransaction) => {
    openAiChatShortcut({
      open: true,
      mode: 'general',
      prompt: `Explain this failed M-Pesa collection and suggest the next step. Reference: ${transaction.reference}. Invoice: ${transaction.invoice_number || `#${transaction.invoice}`}. Amount: ${formatCurrency(transaction.amount, transaction.currency)}. Phone: ${transaction.phone_number}. Result: ${transaction.result_description || transaction.result_code || 'No provider message available'}.`,
    });
  };

  return (
    <>
      <Navbar title="Payments" subtitle="Initiate M-Pesa STK push and track payment confirmations" />

      <main className="min-h-screen bg-gray-50/60 p-6 transition-colors duration-200 dark:bg-gray-950 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Payments</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Initiate M-Pesa collections and review transaction confirmations.</p>
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
                    helperText="Payment prompts and transaction logs will follow the selected company."
                    className="w-full sm:w-[320px]"
                  />
                ) : null}
                <button
                  onClick={handleAskAiAboutPayments}
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
              description="Payments are linked to invoices, and invoices belong to a business. Add a company profile first so collections and receipts stay tied to the right ledger."
            />
          ) : requiresSelection ? (
            <BusinessStateCard
              title="Select a business to continue"
              description="You have more than one business. Pick the active company first so invoices, STK pushes, and payment logs stay in the same business context."
            />
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Initiate STK Push</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice to M-Pesa prompt to callback confirmation</p>
                </div>

                <form onSubmit={initiateStkPush} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                    <select
                      value={invoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">Select invoice</option>
                      {unpaidInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - {invoice.client_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Phone Number</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Amount (KES)</label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-gray-900"
                    >
                      <CreditCard className="h-4 w-4" />
                      {isSubmitting ? 'Processing...' : 'Initiate STK'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transactions</h3>
                </div>

                {isLoading ? (
                  <div className="p-6 text-sm text-gray-500">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No payment transactions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                          <th className="px-6 py-3">Reference</th>
                          <th className="px-6 py-3">Invoice</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Phone</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">AI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{transaction.reference}</td>
                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{transaction.invoice_number || `#${transaction.invoice}`}</td>
                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </td>
                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{transaction.phone_number}</td>
                            <td className="px-6 py-3">
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                transaction.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : transaction.status === 'failed'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-500">{formatDate(transaction.created_at)}</td>
                            <td className="px-6 py-3">
                              {transaction.status === 'failed' ? (
                                <button
                                  type="button"
                                  onClick={() => handleExplainFailedCollection(transaction)}
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
