'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  FileText,
  Filter,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { Navbar } from '@/components/Navbar';
import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { Input } from '@/components/ui/Input';
import { MetricCard } from '@/components/ui/MetricCard';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { Invoice, InvoiceFilters } from '@/types';
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getBalanceDue = (invoice: Invoice): number => {
  const balanceFromApi = toNumber(invoice.balance_due);
  if (balanceFromApi) return balanceFromApi;
  const total = toNumber(invoice.total_amount);
  const paid = toNumber(invoice.amount_paid);
  const balance = total - paid;
  return balance > 0 ? balance : 0;
};

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

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (data && typeof data === 'object') {
    const payload = data as {
      error?: string;
      detail?: string;
      error_message?: string;
      provider_response?: { error?: string };
    };
    return (
      payload.error ||
      payload.detail ||
      payload.error_message ||
      payload.provider_response?.error ||
      fallback
    );
  }
  return fallback;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
    sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30',
    draft: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30',
    partial: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] || map.draft}`}>
      {getStatusText(status)}
    </span>
  );
};

const BusinessStateCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Building2 className="h-6 w-6 text-slate-500 dark:text-slate-300" />
    </div>
    <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
  </section>
);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ phone: '', amount: '' });
  const [paymentErrors, setPaymentErrors] = useState<{ phone?: string; amount?: string }>({});
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [optimisticPayments, setOptimisticPayments] = useState<Record<number, { status: 'pending' | 'partial' | 'paid'; balance_due?: number; amount_paid?: number }>>({});
  const router = useRouter();
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    hasBusinesses,
    requiresSelection,
    error: businessError,
    isLoading: isBusinessLoading,
  } = useActiveBusiness();
  const showBusinessSelector = businesses.length > 1;
  const businessName = activeBusiness?.display_name || activeBusiness?.business_name;

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      ...(activeBusinessId ? { business_id: activeBusinessId } : {}),
    }),
    [activeBusinessId, filters]
  );

  const fetchInvoices = useCallback(async () => {
    if (isBusinessLoading) return;
    if (!hasBusinesses || requiresSelection) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.invoices.getAll(effectiveFilters);
      setInvoices(parseList<Invoice>(response.data));
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFilters, hasBusinesses, isBusinessLoading, requiresSelection]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  useEffect(() => {
    router.prefetch(ROUTES.createInvoice);
  }, [router]);

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    try {
      await apiService.invoices.delete(selectedInvoice.id);
      toast.success('Invoice deleted');
      setShowDeleteModal(false);
      setSelectedInvoice(null);
      await fetchInvoices();
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      await apiService.invoices.markAsPaid(id);
      toast.success('Invoice marked as paid');
      await fetchInvoices();
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const handleSendEmail = async (id: number) => {
    try {
      await apiService.invoices.sendEmail(id);
      toast.success('Invoice sent via email');
    } catch {
      toast.error('Failed to send invoice email');
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      const response = await apiService.invoices.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download invoice PDF');
    }
  };

  const handleDownloadReceipt = async (id: number, receiptNumber?: string | null) => {
    try {
      const response = await apiService.invoices.downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receiptNumber || `receipt-${id}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to download receipt'));
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    const balanceDue = getBalanceDue(invoice);
    if (invoice.status === 'paid' || balanceDue <= 0) {
      toast.error('Invoice is already paid');
      return;
    }
    setPaymentInvoice(invoice);
    setPaymentForm({
      phone: '',
      amount: String(balanceDue || invoice.total_amount),
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentInvoice(null);
    setPaymentForm({ phone: '', amount: '' });
    setPaymentErrors({});
  };

  const handleSubmitPayment = async () => {
    if (!paymentInvoice) return;
    const balanceDue = getBalanceDue(paymentInvoice);
    const amountValue = Number.parseFloat(paymentForm.amount);

    const nextErrors: { phone?: string; amount?: string } = {};
    if (!paymentForm.phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (!paymentForm.amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Enter a valid amount.';
    } else if (amountValue > balanceDue) {
      nextErrors.amount = `Amount cannot exceed balance due (${formatCurrency(balanceDue, paymentInvoice.currency)}).`;
    }

    setPaymentErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsPaymentSubmitting(true);
      setOptimisticPayments((prev) => ({
        ...prev,
        [paymentInvoice.id]: {
          status: 'pending',
        },
      }));

      await apiService.payments.initiateStkPush({
        invoice_id: paymentInvoice.id,
        phone_number: paymentForm.phone.trim(),
        amount: paymentForm.amount.trim(),
      });

      const newBalance = Math.max(balanceDue - amountValue, 0);
      const newPaid = toNumber(paymentInvoice.amount_paid) + amountValue;
      setOptimisticPayments((prev) => ({
        ...prev,
        [paymentInvoice.id]: {
          status: newBalance <= 0 ? 'paid' : 'partial',
          balance_due: newBalance,
          amount_paid: newPaid,
        },
      }));

      toast.success('STK push initiated');
      closePaymentModal();
      await fetchInvoices();
    } catch (error: unknown) {
      setOptimisticPayments((prev) => {
        const next = { ...prev };
        delete next[paymentInvoice.id];
        return next;
      });
      toast.error(getApiErrorMessage(error, 'Failed to initiate STK push'));
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const handleSendWhatsApp = async (invoice: Invoice) => {
    const phoneNumber = window.prompt(`Enter WhatsApp phone for ${invoice.invoice_number}:`, '');
    if (!phoneNumber?.trim()) return;

    const customMessage = window.prompt('Optional custom message (leave blank to use default):', '');
    if (customMessage === null) return;

    try {
      await apiService.messaging.sendInvoiceWhatsApp({
        invoice_id: invoice.id,
        phone_number: phoneNumber.trim(),
        ...(customMessage.trim() ? { message: customMessage.trim() } : {}),
      });
      toast.success('WhatsApp invoice sent');
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to send WhatsApp message'));
    }
  };

  const handleSubmitEtims = async (invoice: Invoice) => {
    if (invoice.tax_invoice_number) {
      toast.success(`Already synced: ${invoice.tax_invoice_number}`);
      return;
    }

    try {
      const response = await apiService.tax.submitInvoice({ invoice_id: invoice.id });
      const taxInvoiceNumber = (response.data as { tax_invoice_number?: string })?.tax_invoice_number;
      toast.success(taxInvoiceNumber ? `Submitted to eTIMS: ${taxInvoiceNumber}` : 'Invoice submitted to eTIMS');
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to submit invoice to eTIMS'));
    }
  };

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) =>
      invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [invoices, searchQuery]
  );

  const getDisplayInvoice = useCallback((invoice: Invoice) => {
    const override = optimisticPayments[invoice.id];
    if (!override) return invoice;
    return {
      ...invoice,
      status: override.status,
      balance_due: override.balance_due ?? invoice.balance_due,
      amount_paid: override.amount_paid ?? invoice.amount_paid,
    };
  }, [optimisticPayments]);

  const displayInvoices = useMemo(
    () => filteredInvoices.map((invoice) => getDisplayInvoice(invoice)),
    [filteredInvoices, getDisplayInvoice]
  );

  const summary = useMemo(
    () => ({
      total: displayInvoices.length,
      paid: displayInvoices.filter((invoice) => invoice.status === 'paid').length,
      pending: displayInvoices.filter((invoice) => ['sent', 'pending', 'partial'].includes(invoice.status)).length,
      totalAmount: displayInvoices.reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0),
    }),
    [displayInvoices]
  );

  const ActionButtons = ({ invoice }: { invoice: Invoice }) => (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => handleDownloadPDF(invoice.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">PDF</button>
      <button onClick={() => handleSendEmail(invoice.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Email</button>
      <button
        onClick={() => handleDownloadReceipt(invoice.id, invoice.receipt_number)}
        disabled={invoice.status !== 'paid'}
        className={`rounded-lg border px-2 py-1 text-xs font-medium ${invoice.status === 'paid' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'}`}
      >
        <span className="inline-flex items-center gap-1"><ReceiptText className="h-3 w-3" /> Receipt</span>
      </button>
      <button
        onClick={() => openPaymentModal(invoice)}
        disabled={invoice.status === 'paid' || invoice.status === 'pending' || getBalanceDue(invoice) <= 0}
        className={`rounded-lg border px-2 py-1 text-xs font-medium ${
          invoice.status === 'paid' || invoice.status === 'pending' || getBalanceDue(invoice) <= 0
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
            : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-950/30 dark:text-indigo-300'
        }`}
      >
        Pay M-Pesa
      </button>
      <button onClick={() => handleSendWhatsApp(invoice)} className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-300">Send WhatsApp</button>
      <button
        onClick={() => handleSubmitEtims(invoice)}
        disabled={Boolean(invoice.tax_invoice_number)}
        className={`rounded-lg border px-2 py-1 text-xs font-medium ${invoice.tax_invoice_number ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300'}`}
      >
        {invoice.tax_invoice_number ? 'eTIMS Synced' : 'Submit eTIMS'}
      </button>
      {invoice.status !== 'paid' && (
        <button onClick={() => handleMarkAsPaid(invoice.id)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300">Mark Paid</button>
      )}
      <button
        onClick={() => { setSelectedInvoice(invoice); setShowDeleteModal(true); }}
        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300"
      >
        <span className="inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</span>
      </button>
    </div>
  );

  return (
    <>
      <Navbar title="Invoices" subtitle="Create, manage, and collect payments from one place" />

      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Billing</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Invoices</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generate invoices, send them, collect payments, and sync tax details.</p>
                {businessName ? (
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Showing <span className="text-slate-900 dark:text-white">{businessName}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {showBusinessSelector ? (
                  <ActiveBusinessSelector
                    businesses={businesses}
                    activeBusinessId={activeBusinessId}
                    onChange={setActiveBusinessId}
                    helperText="Invoices, collections, and tax sync actions will follow the selected company."
                    className="w-full sm:w-[320px]"
                  />
                ) : null}
                <Link
                  href={ROUTES.createInvoice}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" /> New Invoice
                </Link>
              </div>
            </div>
          </section>

          {!hasBusinesses && !isBusinessLoading ? (
            <BusinessStateCard
              title="Create a business first"
              description="Invoices belong to a business. Add a company profile first so invoice numbers, payments, WhatsApp delivery, and eTIMS submissions stay tied to the right business ledger."
            />
          ) : requiresSelection ? (
            <BusinessStateCard
              title="Select a business to continue"
              description="You have more than one business. Choose the active company first so invoice lists, quick actions, and payment status updates stay inside one clear business context."
            />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Invoices"
                  value={summary.total}
                  subtitle={activeBusiness ? 'Active business records' : 'All invoice records'}
                  icon={FileText}
                  tone="slate"
                />
                <MetricCard
                  label="Paid"
                  value={summary.paid}
                  subtitle="Settled invoices"
                  icon={ReceiptText}
                  tone="emerald"
                />
                <MetricCard
                  label="Pending"
                  value={summary.pending}
                  subtitle="Awaiting payment"
                  icon={ReceiptText}
                  tone="amber"
                />
                <MetricCard
                  label="Total Value"
                  value={summary.totalAmount}
                  subtitle="Invoice portfolio"
                  icon={ReceiptText}
                  tone="blue"
                  isCurrency
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search invoice #, client, email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters((prev) => !prev)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${showFilters ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  >
                    <Filter className="h-4 w-4" /> Filters <ChevronDown className={`h-3.5 w-3.5 transition ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showFilters && (
                  <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
                        <select
                          value={filters.status || ''}
                          onChange={(e) => {
                            const nextStatus = e.target.value as '' | 'draft' | 'sent' | 'paid';
                            setFilters({ ...filters, status: nextStatus || undefined });
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="">All</option>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">From</label>
                        <Input type="date" value={filters.date_from || ''} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">To</label>
                        <Input type="date" value={filters.date_to || ''} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setFilters({})}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Filter className="h-3.5 w-3.5" /> Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="p-12 text-center text-sm text-slate-500">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No invoices found</p>
                    <p className="mt-1 text-xs text-slate-500">Create your first invoice or adjust search filters.</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                            <th className="px-6 py-3.5">Invoice</th>
                            <th className="px-6 py-3.5">Client</th>
                            <th className="px-6 py-3.5">Dates</th>
                            <th className="px-6 py-3.5">Amount</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {displayInvoices.map((displayInvoice) => {
                            return (
                            <tr key={displayInvoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">
                                <Link href={`/invoices/${displayInvoice.id}`} className="hover:underline">
                                  {displayInvoice.invoice_number}
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-900 dark:text-slate-100">{displayInvoice.client_name}</p>
                                <p className="text-xs text-slate-500">{displayInvoice.client_email}</p>
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                <p>{formatDate(displayInvoice.issue_date)}</p>
                                <p className="text-xs text-slate-500">Due {formatDate(displayInvoice.due_date)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(displayInvoice.total_amount, displayInvoice.currency)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Balance {formatCurrency(getBalanceDue(displayInvoice), displayInvoice.currency)}
                                </p>
                              </td>
                              <td className="px-6 py-4"><StatusBadge status={displayInvoice.status} /></td>
                              <td className="px-6 py-4"><ActionButtons invoice={displayInvoice} /></td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3 p-4 md:hidden">
                      {displayInvoices.map((displayInvoice) => {
                        return (
                        <div key={displayInvoice.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link href={`/invoices/${displayInvoice.id}`} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                {displayInvoice.invoice_number}
                              </Link>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{displayInvoice.client_name}</p>
                              <p className="text-xs text-slate-500">{displayInvoice.client_email}</p>
                            </div>
                            <StatusBadge status={displayInvoice.status} />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500">Issued</p>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(displayInvoice.issue_date)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Due</p>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(displayInvoice.due_date)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-500">Amount</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(displayInvoice.total_amount, displayInvoice.currency)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-500">Balance Due</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(getBalanceDue(displayInvoice), displayInvoice.currency)}</p>
                            </div>
                          </div>
                          <div className="mt-3"><ActionButtons invoice={displayInvoice} /></div>
                        </div>
                      );
                      })}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Invoice">
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">This action is permanent</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Invoice <span className="font-semibold">{selectedInvoice?.invoice_number}</span> will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" /> Delete Invoice
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
        title={paymentInvoice ? `Pay ${paymentInvoice.invoice_number}` : 'Pay Invoice'}
      >
        <div className="space-y-4">
          {paymentInvoice && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">{paymentInvoice.client_name}</p>
              <p className="text-xs text-slate-500">{paymentInvoice.client_email}</p>
              <p className="mt-2 text-xs text-slate-500">Balance Due</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {formatCurrency(getBalanceDue(paymentInvoice), paymentInvoice.currency)}
              </p>
            </div>
          )}

          <Input
            label="M-Pesa Phone"
            placeholder="2547XXXXXXXX"
            value={paymentForm.phone}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, phone: e.target.value }))}
            error={paymentErrors.phone}
          />
          <Input
            label="Amount"
            type="number"
            step="1"
            min="1"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
            error={paymentErrors.amount}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closePaymentModal}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPaymentSubmitting}
              onClick={handleSubmitPayment}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {isPaymentSubmitting ? 'Sending…' : 'Send STK Push'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
