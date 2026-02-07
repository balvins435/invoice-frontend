'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { Invoice, InvoiceFilters } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.invoices.getAll(filters);
      setInvoices(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    try {
      await apiService.invoices.delete(selectedInvoice.id);
      toast.success('Invoice deleted successfully');
      fetchInvoices();
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      await apiService.invoices.markAsPaid(invoiceId);
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const handleSendEmail = async (invoiceId: number) => {
    try {
      await apiService.invoices.sendEmail(invoiceId);
      toast.success('Invoice sent via email');
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const response = await apiService.invoices.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.client_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const invoiceSummary = {
    total: filteredInvoices.length,
    paid: filteredInvoices.filter(i => i.status === 'paid').length,
    pending: filteredInvoices.filter(i => i.status === 'sent').length,
    draft: filteredInvoices.filter(i => i.status === 'draft').length,
    totalAmount: filteredInvoices.reduce((sum, i) => sum + i.total_amount, 0),
  };

  return (
    <>
      <Navbar 
        title="Invoices" 
        subtitle="Create, manage, and send invoices to your clients"
      />
      
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{invoiceSummary.total}</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Paid</p>
              <p className="text-3xl font-bold text-success-600">{invoiceSummary.paid}</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Pending</p>
              <p className="text-3xl font-bold text-warning-600">{invoiceSummary.pending}</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Total Amount</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(invoiceSummary.totalAmount)}
              </p>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                className="w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Link href="/dashboard/invoices/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="input-primary"
                    value={filters.status || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      status: e.target.value as any,
                    })}
                  >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      date_from: e.target.value,
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      date_to: e.target.value,
                    })}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Invoices Table */}
        <Card>
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-500">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try changing your search query' : 'Get started by creating your first invoice'}
              </p>
              <Link href="/dashboard/invoices/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header">Invoice #</th>
                    <th className="table-header">Client</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium text-primary-600">
                          {invoice.invoice_number}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium">{invoice.client_name}</div>
                          <div className="text-sm text-gray-500">{invoice.client_email}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="table-cell">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="table-cell font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="table-cell">
                        <Badge variant={getStatusColor(invoice.status).split(' ')[0] as any}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleSendEmail(invoice.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded hover:bg-success-200"
                              title="Mark as Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-danger-600"
                            title="Delete"
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
        </Card>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Invoice"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete invoice{' '}
            <span className="font-semibold">{selectedInvoice?.invoice_number}</span>?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}