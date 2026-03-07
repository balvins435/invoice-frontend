'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, RefreshCw } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { Invoice, WhatsAppMessage } from '@/types';
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
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
};

export default function MessagingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');

  const availableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'draft' || invoice.status === 'sent'),
    [invoices]
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invoiceRes, messageRes] = await Promise.all([
        apiService.invoices.getAll(),
        apiService.messaging.getWhatsAppMessages(),
      ]);
      const invoiceList = parseList<Invoice>(invoiceRes.data);
      const messageList = parseList<WhatsAppMessage>(messageRes.data);
      setInvoices(invoiceList);
      setMessages(messageList);

      if (!invoiceId && invoiceList.length > 0) {
        const selectable = invoiceList.find((item) => item.status !== 'paid');
        if (selectable) setInvoiceId(String(selectable.id));
      }
    } catch {
      toast.error('Failed to load messaging data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendWhatsApp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoiceId || !phoneNumber.trim()) {
      toast.error('Invoice and phone number are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.messaging.sendInvoiceWhatsApp({
        invoice_id: Number(invoiceId),
        phone_number: phoneNumber.trim(),
        ...(messageText.trim() ? { message: messageText.trim() } : {}),
      });
      toast.success('WhatsApp invoice message sent');
      setPhoneNumber('');
      setMessageText('');
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiError(error, 'Failed to send WhatsApp message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar title="Messaging" subtitle="Send invoices to customers via WhatsApp" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Invoice to WhatsApp</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select invoice, provide customer number, send message link</p>
              </div>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            <form onSubmit={sendWhatsApp} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">Select invoice</option>
                  {availableInvoices.map((invoice) => (
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
                  placeholder="+2547XXXXXXXX"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Custom Message (Optional)</label>
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Hello, your invoice is ready"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send WhatsApp'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Message Logs</h3>
            </div>

            {isLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No WhatsApp messages yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Link</th>
                      <th className="px-6 py-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200">{message.invoice_number || `#${message.invoice}`}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{message.phone_number}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            message.delivery_status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700'
                              : message.delivery_status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {message.delivery_status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href={message.invoice_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Open
                          </a>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{message.sent_at ? formatDate(message.sent_at) : '-'}</td>
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
