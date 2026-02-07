import { Invoice, InvoiceItem, CreateInvoiceData } from './index';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceFilters {
  status?: InvoiceStatus;
  client_name?: string;
  date_from?: string;
  date_to?: string;
  business_id?: number;
}

export interface InvoiceSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface InvoiceExportData {
  invoice: Invoice;
  business_logo?: string;
  business_info: {
    name: string;
    email: string;
    phone: string;
    address: string;
    tax_rate: number;
  };
}