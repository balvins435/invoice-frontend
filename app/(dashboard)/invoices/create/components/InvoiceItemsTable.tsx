'use client';

import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { InvoiceFormValues } from './InvoiceForm';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface Props {
  items: InvoiceFormValues['items'];
  register: UseFormRegister<InvoiceFormValues>;
  errors: FieldErrors<InvoiceFormValues>;
  onCalculate: (index: number, quantity: number, unitPrice: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const InvoiceItemsTable: React.FC<Props> = ({
  items, register, errors, onCalculate, onAdd, onRemove,
}) => {
  return (
    <div className="space-y-3">

      {/* ── Desktop column headers ── */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1" />
      </div>

      {/* ── Rows ── */}
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-3 md:grid-cols-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 md:rounded-none md:border-0 md:bg-transparent md:p-0"
        >
          {/* Description */}
          <div className="col-span-1 md:col-span-5">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Description</label>
            <Input
              {...register(`items.${index}.description`)}
              placeholder="Item or service description"
              error={errors.items?.[index]?.description?.message}
            />
          </div>

          {/* Quantity */}
          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Quantity</label>
            <Input
              type="number" step="1" min="1"
              {...register(`items.${index}.quantity`, {
                valueAsNumber: true,
                onChange: (e) => onCalculate(index, parseFloat(e.target.value) || 0, item.unit_price),
              })}
              placeholder="1"
              className="text-right"
              error={errors.items?.[index]?.quantity?.message}
            />
          </div>

          {/* Unit price */}
          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Unit Price</label>
            <Input
              type="number" step="1" min="0"
              {...register(`items.${index}.unit_price`, {
                valueAsNumber: true,
                onChange: (e) => onCalculate(index, item.quantity, parseFloat(e.target.value) || 0),
              })}
              placeholder="0.00"
              className="text-right"
              leftIcon={<span className="text-xs text-gray-400 dark:text-gray-500">KES</span>}
              error={errors.items?.[index]?.unit_price?.message}
            />
          </div>

          {/* Total (read-only) */}
          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Total</label>
            <div className="flex h-10 items-center justify-end rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(item.total)}
            </div>
          </div>

          {/* Remove */}
          <div className="col-span-1 md:col-span-1 flex items-center justify-end md:justify-center">
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={items.length === 1}
              title="Remove item"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* ── Add row ── */}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
      >
        <Plus className="h-4 w-4" />
        Add line item
      </button>
    </div>
  );
};
