'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { apiService } from '@/lib/api';
import { openAiChatShortcut } from '@/lib/ai';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
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

export default function MessagingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');

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

  const availableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'draft' || invoice.status === 'sent'),
    [invoices]
  );

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  const syncSelectedInvoice = useCallback((invoiceList: Invoice[]) => {
    const firstAvailable = invoiceList.find((item) => item.status !== 'paid');
    const selectedInvoice =
      invoiceList.find((item) => String(item.id) === invoiceId && item.status !== 'paid') || firstAvailable;

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
      setMessages([]);
      setInvoiceId('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = activeBusinessId ? { business_id: activeBusinessId } : undefined;
      const [invoiceRes, messageRes] = await Promise.all([
        apiService.invoices.getAll(params),
        apiService.messaging.getWhatsAppMessages(params),
      ]);
      const invoiceList = parseList<Invoice>(invoiceRes.data);
      const messageList = parseList<WhatsAppMessage>(messageRes.data);
      setInvoices(invoiceList);
      setMessages(messageList);
      syncSelectedInvoice(invoiceList);
    } catch {
      toast.error('Failed to load messaging data');
    } finally {
      setIsLoading(false);
    }
  }, [activeBusinessId, hasBusinesses, isBusinessLoading, requiresSelection, syncSelectedInvoice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleAskAiAboutMessaging = () => {
    openAiChatShortcut({
      open: true,
      mode: 'general',
      prompt: businessName
        ? `Review the WhatsApp invoice activity for ${businessName}. Summarize failed deliveries, likely reasons, and what message follow-up I should send next.`
        : 'Review the WhatsApp invoice activity. Summarize failed deliveries, likely reasons, and what message follow-up I should send next.',
    });
  };

  const handleDraftFollowUp = (message: WhatsAppMessage) => {
    openAiChatShortcut({
      open: true,
      mode: 'general',
      prompt: `Draft a short WhatsApp follow-up for invoice ${message.invoice_number || `#${message.invoice}`} to ${message.phone_number}. The previous delivery status was ${message.delivery_status}. Keep it professional and customer-friendly.`,
    });
  };

  return (
    <>
      <Navbar title="Messaging" subtitle="Send invoices to customers via WhatsApp" />

      <main className="min-h-screen bg-gray-50/60 p-6 transition-colors duration-200 dark:bg-gray-950 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Messaging</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Send invoice links to customers via WhatsApp and review delivery logs.</p>
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
                    helperText="Invoice options and WhatsApp delivery logs will follow the selected company."
                    className="w-full sm:w-[320px]"
                  />
                ) : null}
                <button
                  onClick={handleAskAiAboutMessaging}
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
              description="Messaging works on invoices, and invoices belong to a business. Add a business profile first so invoice links and WhatsApp logs stay attached to the right company."
            />
          ) : requiresSelection ? (
            <BusinessStateCard
              title="Select a business to continue"
              description="You have more than one business. Pick the active company first so invoice options and WhatsApp logs stay in the same business context."
            />
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Invoice to WhatsApp</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select invoice, provide customer number, send message link</p>
                </div>

                <form onSubmit={sendWhatsApp} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</label>
                    <select
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Custom Message (Optional)</label>
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Hello, your invoice is ready"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-gray-900"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {isSubmitting ? 'Sending...' : 'Send WhatsApp'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
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
                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                          <th className="px-6 py-3">Invoice</th>
                          <th className="px-6 py-3">Phone</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Link</th>
                          <th className="px-6 py-3">Sent</th>
                          <th className="px-6 py-3">AI</th>
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
                            <td className="px-6 py-3">
                              {message.delivery_status === 'failed' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDraftFollowUp(message)}
                                  className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-xs font-medium text-fuchsia-700 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
                                >
                                  Draft Follow-up
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
