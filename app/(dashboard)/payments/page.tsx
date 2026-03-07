'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, RefreshCw } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
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

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== 'paid'),
    [invoices]
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invoicesRes, txRes] = await Promise.all([
        apiService.invoices.getAll(),
        apiService.payments.getTransactions(),
      ]);

      const invoiceList = parseList<Invoice>(invoicesRes.data);
      const txList = parseList<PaymentTransaction>(txRes.data);

      setInvoices(invoiceList);
      setTransactions(txList);

      if (!invoiceId && invoiceList.length > 0) {
        const firstUnpaid = invoiceList.find((item) => item.status !== 'paid');
        if (firstUnpaid) {
          setInvoiceId(String(firstUnpaid.id));
          setAmount(String(firstUnpaid.total_amount));
        }
      }
    } catch {
      toast.error('Failed to load payments data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvoiceChange = (nextInvoiceId: string) => {
    setInvoiceId(nextInvoiceId);
    const selected = invoices.find((item) => item.id === Number(nextInvoiceId));
    setAmount(selected ? String(selected.total_amount) : '');
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

  return (
    <>
      <Navbar title="Payments" subtitle="Initiate M-Pesa STK push and track payment confirmations" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Initiate STK Push</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice to M-Pesa prompt to callback confirmation</p>
              </div>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            <form onSubmit={initiateStkPush} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                <select
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Amount (KES)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {isSubmitting ? 'Processing...' : 'Initiate STK'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
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
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{transaction.reference}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{transaction.invoice_number || `#${transaction.invoice}`}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(Number(transaction.amount || 0))}</td>
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
