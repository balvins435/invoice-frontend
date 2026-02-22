'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Filter, Download, Mail, Eye, Edit,
  Trash2, FileText, ChevronDown, AlertTriangle, X, ReceiptText,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { Invoice, InvoiceFilters } from '@/types';
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// ── helpers ──────────────────────────────────────────────────────────────────
const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') { const p = parseFloat(v); return Number.isFinite(p) ? p : 0; }
  return 0;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    paid:    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    sent:    'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    draft:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    overdue: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.draft}`}>
      {getStatusText(status)}
    </span>
  );
};

// ── component ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [invoices, setInvoices]           = useState<Invoice[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filters, setFilters]             = useState<InvoiceFilters>({});
  const [showFilters, setShowFilters]     = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingRoute, setPendingRoute]   = useState<string | null>(null);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => { fetchInvoices(); }, [filters]);
  useEffect(() => { router.prefetch('/invoices/create'); }, [router]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.invoices.getAll(filters);
      setInvoices(res.data.results || res.data);
    } catch { toast.error('Failed to load invoices'); }
    finally  { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    try {
      await apiService.invoices.delete(selectedInvoice.id);
      toast.success('Invoice deleted');
      fetchInvoices();
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch { toast.error('Failed to delete invoice'); }
  };

  const handleMarkAsPaid  = async (id: number) => { try { await apiService.invoices.markAsPaid(id);  toast.success('Marked as paid');   fetchInvoices(); } catch { toast.error('Failed to update'); } };
  const handleSendEmail   = async (id: number) => { try { await apiService.invoices.sendEmail(id);   toast.success('Invoice sent');      } catch { toast.error('Failed to send');   } };
  const handleDownloadPDF = async (id: number) => {
    try {
      const res = await apiService.invoices.downloadPDF(id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { toast.error('Failed to download'); }
  };
  const handleDownloadReceipt = async (id: number, receiptNumber?: string | null) => {
    try {
      const res = await apiService.invoices.downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receiptNumber || `receipt-${id}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      let message = 'Failed to download receipt';
      const response = (error as { response?: { data?: unknown; status?: number } })?.response;

      if (response?.data instanceof Blob) {
        const text = await response.data.text();
        try {
          const parsed = JSON.parse(text) as { error?: string; detail?: string };
          message = parsed.error || parsed.detail || message;
        } catch {
          if (text.trim()) message = text.trim();
        }
      } else if (response?.data && typeof response.data === 'object') {
        const parsed = response.data as { error?: string; detail?: string };
        message = parsed.error || parsed.detail || message;
      } else if (response?.status) {
        message = `Failed to download receipt (HTTP ${response.status})`;
      }

      toast.error(message);
    }
  };

  const filtered = invoices.filter(inv =>
    inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.client_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    total: filtered.length,
    paid: filtered.filter(i => i.status === 'paid').length,
    pending: filtered.filter(i => i.status === 'sent').length,
    draft: filtered.filter(i => i.status === 'draft').length,
    amount: filtered.reduce((s, i) => s + toNumber(i.total_amount), 0),
  };

  const isCreatePending = pendingRoute === '/invoices/create' && pathname !== '/invoices/create';

  return (
    <>
      <Navbar title="Invoices" subtitle="Create, manage, and send invoices to your clients" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Invoices</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage and send invoices to your clients</p>
            </div>
            <Link
              href="/invoices/create"
              onClick={() => setPendingRoute('/invoices/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>

          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Total Invoices', value: summary.total,   accent: 'text-gray-900 dark:text-white' },
              { label: 'Paid',           value: summary.paid,    accent: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Pending',        value: summary.pending, accent: 'text-amber-600 dark:text-amber-400' },
              { label: 'Total Value',    value: formatCurrency(summary.amount), accent: 'text-blue-600 dark:text-blue-400', isText: true },
            ].map(({ label, value, accent, isText }) => (
              <div key={label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
                <p className={`mt-2 ${isText ? 'text-xl' : 'text-3xl'} font-bold tabular-nums ${accent}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by client, number…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</label>
                    <div className="relative">
                      <select
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
                      >
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">From</label>
                    <Input type="date" value={filters.date_from || ''} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">To</label>
                    <Input type="date" value={filters.date_to || ''} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({})}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white" />
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading invoices…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {searchQuery ? 'No invoices match your search' : 'No invoices yet'}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {searchQuery ? 'Try a different query' : 'Create your first invoice to get started'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/invoices/create"
                    onClick={() => setPendingRoute('/invoices/create')}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Create Invoice
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                        <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.client_name}</p>
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{invoice.client_email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.issue_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.due_date)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* Icon actions */}
                            {[
                              { icon: Download, title: 'Download PDF', onClick: () => handleDownloadPDF(invoice.id) },
                              { icon: Mail,     title: 'Send Email',   onClick: () => handleSendEmail(invoice.id) },
                              { icon: Eye,      title: 'View',         onClick: () => toast.error('View not implemented') },
                              { icon: Edit,     title: 'Edit',         onClick: () => toast.error('Edit not implemented') },
                            ].map(({ icon: Icon, title, onClick }) => (
                              <button key={title} onClick={onClick} title={title}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            ))}
                            <button
                              onClick={() => handleDownloadReceipt(invoice.id, invoice.receipt_number)}
                              title={invoice.status === 'paid' ? 'Download Receipt' : 'Receipt available after payment'}
                              disabled={invoice.status !== 'paid'}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                invoice.status === 'paid'
                                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950'
                                  : 'cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                              }`}
                            >
                              <ReceiptText className="h-3.5 w-3.5" />
                              Receipt
                            </button>
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedInvoice(invoice); setShowDeleteModal(true); }}
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Invoice">
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">This action is permanent</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Invoice <span className="font-semibold">{selectedInvoice?.invoice_number}</span> will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 dark:bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
              <Trash2 className="h-4 w-4" /> Delete Invoice
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
