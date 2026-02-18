'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Camera, Loader2, X, FileText, Building2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { ExpenseCategorySelect } from './ExpenseCategorySelect';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types/expense';
import { useCreateExpense, useUpdateExpense } from '@/lib/hooks/useExpenses';
import { Business } from '@/types';
import toast from 'react-hot-toast';

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  expense_date: z.date(),
  tax_deductible: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  initialData?: FormData;
  expenseId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  businesses?: Business[];
  selectedBusinessId?: number | null;
  onBusinessChange?: (id: number | null) => void;
}

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
export const ExpenseForm: React.FC<Props> = ({
  initialData, expenseId, onSuccess, onCancel, businesses = [],
  selectedBusinessId, onBusinessChange,
}) => {
  const [receipt, setReceipt]         = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [date, setDate]               = useState<Date>(initialData?.expense_date || new Date());
  const [businessError, setBusinessError] = useState<string | null>(null);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      title: '', category: '', amount: 0, expense_date: new Date(),
      tax_deductible: true, notes: '',
    },
  });

  const taxDeductible = watch('tax_deductible');

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
      const r = new FileReader();
      r.onloadend = () => setPreview(r.result as string);
      r.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!expenseId && !selectedBusinessId) {
        setBusinessError('Please select a business');
        return;
      }
      const payload = {
        ...data,
        business_id: selectedBusinessId || undefined,
        category: data.category as keyof typeof EXPENSE_CATEGORIES,
        expense_date: format(data.expense_date, 'yyyy-MM-dd'),
        amount: Number(data.amount),
        receipt: receipt || undefined,
      };
      if (expenseId) await updateExpense.mutateAsync({ id: expenseId, data: payload });
      else await createExpense.mutateAsync(payload);
      toast.success(expenseId ? 'Expense updated' : 'Expense created');
      onSuccess?.();
    } catch (err) {
      toast.error('Failed to save expense');
    }
  };

  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500';

  return (
    <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

      {/* ── Business selection (if creating) ── */}
      {!expenseId && (
        <Section icon={Building2} title="Business" subtitle="Which business is this expense for?">
          <div>
            <label className={labelCls}>Select Business *</label>
            <div className="relative">
              <select
                value={selectedBusinessId ?? ''}
                onChange={e => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  onBusinessChange?.(v);
                  setBusinessError(null);
                }}
                className={cn(
                  'w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm transition-colors',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white',
                  businessError && 'border-red-400 dark:border-red-600'
                )}
              >
                <option value="">Choose a business</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name}</option>)}
              </select>
            </div>
            {businessError && <p className="mt-1 text-xs text-red-500">{businessError}</p>}
          </div>
        </Section>
      )}

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── Expense details ── */}
      <Section icon={FileText} title="Expense Details" subtitle="Core information about this expense">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Expense Title *" {...register('title')} error={errors.title?.message} placeholder="e.g., Office Rent, Internet Bill" />
          </div>
          <ExpenseCategorySelect
            label="Category"
            required
            value={watch('category')}
            onChange={v => setValue('category', v)}
            error={errors.category?.message}
          />
          <div>
            <label className={labelCls}>Amount (KES) *</label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              placeholder="0.00"
              leftIcon={<span className="text-xs text-gray-400 dark:text-gray-500">KES</span>}
            />
          </div>
          <div>
            <label className={labelCls}>Expense Date *</label>
            <Input
              type="date"
              value={format(date, 'yyyy-MM-dd')}
              onChange={e => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) { setDate(d); setValue('expense_date', d); }
              }}
            />
          </div>

          {/* Tax deductible toggle */}
          <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Tax Deductible</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Can be deducted from taxable income</p>
            </div>
            <input
              type="checkbox"
              checked={taxDeductible}
              onChange={e => setValue('tax_deductible', e.target.checked)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 accent-gray-900 dark:accent-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
        </div>
      </Section>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── Additional info ── */}
      <Section icon={Calendar} title="Additional Info">
        <div className="space-y-4">
          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Add any additional details…"
              className="min-h-[90px] w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
            />
          </div>

          {/* Receipt */}
          <div>
            <label className={labelCls}>Receipt (Optional)</label>
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <img src={preview} alt="Receipt" className="h-48 w-full object-contain bg-gray-50 dark:bg-gray-800" />
                <button
                  type="button"
                  onClick={() => { setReceipt(null); setPreview(null); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Camera className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Click to upload</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">PNG, JPG, PDF (max 5MB)</p>
                <input type="file" accept="image/*,.pdf" onChange={handleReceipt} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            )}
          </div>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 dark:border-gray-800 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : expenseId ? (
            'Update Expense'
          ) : (
            'Save Expense'
          )}
        </button>
      </div>
    </form>
  );
};