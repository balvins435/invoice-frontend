'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Building2, User, Mail, Save, Send, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceSummary } from './InvoiceSummary';
import { apiService } from '@/lib/api';
import { consumeAiInvoiceDraft } from '@/lib/ai';
import { getStoredActiveBusinessId } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { Business } from '@/types';
import { cn } from '@/lib/utils';

// ── Schema ───────────────────────────────────────────────────────────────────
const invoiceSchema = z.object({
  business_id: z.string().min(1, 'Please select a business'),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
    total: z.number(),
  })).min(1, 'At least one item is required'),
  status: z.enum(['draft', 'sent']).default('draft'),
});

export type InvoiceFormValues = z.input<typeof invoiceSchema>;
export type InvoiceFormData = z.output<typeof invoiceSchema>;

const getApiErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Failed to create invoice';
  }

  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return 'Failed to create invoice';

  const entries = Object.entries(data as Record<string, unknown>);
  for (const [field, value] of entries) {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string') {
      const label = field === 'non_field_errors' ? '' : `${field.replaceAll('_', ' ')}: `;
      return `${label}${message}`;
    }
  }

  return 'Failed to create invoice';
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div>
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const InvoiceForm: React.FC = () => {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormValues, unknown, InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      business_id: '',
      client_name: '',
      client_email: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      status: 'draft',
    },
  });

  const items = watch('items');
  const businessId = watch('business_id');

  const fetchBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiService.business.getAll();
      const businessList = res.data.results || res.data;
      setBusinesses(businessList);

      const aiDraft = consumeAiInvoiceDraft();
      const storedBusinessId = getStoredActiveBusinessId();
      const draftBusinessId =
        aiDraft?.business_id && businessList.some((business: Business) => business.id === aiDraft.business_id)
          ? aiDraft.business_id
          : storedBusinessId;
      const preferredBusiness =
        businessList.find((business: Business) => business.id === draftBusinessId) ||
        (businessList.length === 1 ? businessList[0] : null);

      if (preferredBusiness) {
        setValue('business_id', String(preferredBusiness.id), { shouldValidate: true });
      }

      if (aiDraft) {
        setValue('client_name', aiDraft.client_name || '', { shouldValidate: true });
        setValue('client_email', aiDraft.client_email || '', { shouldValidate: true });
        setValue('issue_date', aiDraft.issue_date || format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true });
        setValue(
          'due_date',
          aiDraft.due_date || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          { shouldValidate: true }
        );
        setValue(
          'items',
          aiDraft.items.length
            ? aiDraft.items.map((item) => ({
                description: item.description,
                quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
                unit_price: Number.isFinite(item.unit_price) && item.unit_price >= 0 ? item.unit_price : 0,
                total: (item.quantity || 1) * (item.unit_price || 0),
              }))
            : [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
          { shouldValidate: true }
        );
        toast.success('AI draft loaded into the invoice builder.');
      }
    } catch { toast.error('Failed to load businesses'); }
    finally  { setIsLoading(false); }
  }, [setValue]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);
  useEffect(() => {
    if (businessId && businesses.length > 0) {
      setSelectedBusiness(businesses.find(b => b.id.toString() === businessId) || null);
    }
  }, [businessId, businesses]);

  const calculateItemTotal = (index: number, quantity: number, unitPrice: number) => {
    setValue(`items.${index}.total`, quantity * unitPrice);
    setValue('items', [...items]);
  };

  const addItem    = () => setValue('items', [...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) setValue('items', items.filter((_, i) => i !== index));
    else toast.error('At least one item is required');
  };

  const onSubmit = async (data: InvoiceFormData, status: 'draft' | 'sent' = 'draft') => {
    try {
      setIsSubmitting(true);
      const subtotal = data.items.reduce((s, i) => s + i.total, 0);
      const taxRate  = selectedBusiness?.tax_rate || 16;
      const tax      = (subtotal * taxRate) / 100;

      const res = await apiService.invoices.create({
        ...data,
        business_id: parseInt(data.business_id),
        subtotal: +subtotal.toFixed(2),
        tax_amount: +tax.toFixed(2),
        total_amount: +(subtotal + tax).toFixed(2),
        status,
        items: data.items.map(i => ({ ...i, total: +i.total.toFixed(2) })),
      });

      if (status === 'sent') {
        try { await apiService.invoices.sendEmail(res.data.id); }
        catch { toast.error('Invoice created, but email failed to send.'); }
      }

      toast.success(status === 'draft' ? 'Invoice saved as draft!' : 'Invoice created and sent!');
      setTimeout(() => router.push(ROUTES.invoices), 1000);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500';
  const selectCls = 'w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors';

  return (
    <form id="invoice-form" onSubmit={handleSubmit((d) => onSubmit(d, 'draft'))} noValidate>
      <div className="space-y-8">

        {/* ── Business selection ── */}
        <Section icon={Building2} title="Business" subtitle="Which business is issuing this invoice?">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Select Business *</label>
              <div className="relative">
                <select
                  {...register('business_id')}
                  disabled={isLoading}
                  className={cn(selectCls, errors.business_id && 'border-red-400 dark:border-red-600')}
                >
                  <option value="">{isLoading ? 'Loading…' : 'Choose a business'}</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.business_id && <p className="mt-1 text-xs text-red-500">{errors.business_id.message}</p>}
            </div>

            {selectedBusiness && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-500 dark:text-gray-300">
                  {selectedBusiness.business_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedBusiness.business_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">VAT: {selectedBusiness.tax_rate}%</p>
                </div>
              </div>
            )}
          </div>
        </Section>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* ── Client details ── */}
        <Section icon={User} title="Client" subtitle="Who are you billing?">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Client Name *" {...register('client_name')} error={errors.client_name?.message}
              leftIcon={<User className="h-4 w-4" />} placeholder="Jane Doe or Company Ltd" />
            <Input label="Client Email" type="email" {...register('client_email')} error={errors.client_email?.message}
              leftIcon={<Mail className="h-4 w-4" />} placeholder="client@example.com"
              helperText="Required for sending via email" />
          </div>
        </Section>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* ── Dates ── */}
        <Section icon={Calendar} title="Dates">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Issue Date *" type="date" {...register('issue_date')} error={errors.issue_date?.message} />
            <Input label="Due Date *" type="date" {...register('due_date')} error={errors.due_date?.message}
              helperText="Usually 14–30 days from issue date" />
          </div>
        </Section>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* ── Items ── */}
        <div>
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoice Items</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Add the products or services you&apos;re billing for</p>
          </div>
          <InvoiceItemsTable
            items={items} register={register} errors={errors}
            onCalculate={calculateItemTotal} onAdd={addItem} onRemove={removeItem}
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* ── Summary ── */}
        <InvoiceSummary items={items} taxRate={selectedBusiness?.tax_rate || 16} />

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 dark:border-gray-800 pt-6 sm:flex-row sm:justify-end">
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </button>
          <button type="button" disabled={isSubmitting} onClick={handleSubmit((d) => onSubmit(d, 'sent'))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? 'Creating…' : 'Create & Send'}
          </button>
        </div>
      </div>
    </form>
  );
};
