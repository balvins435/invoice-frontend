'use client';

import React from 'react';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { InvoiceFormData } from './InvoiceForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface InvoiceItemsTableProps {
  items: InvoiceFormData['items'];
  register: UseFormRegister<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  onCalculate: (index: number, quantity: number, unitPrice: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  register,
  errors,
  onCalculate,
  onAdd,
  onRemove,
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header - Desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-right">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white border border-gray-200 rounded-lg md:border-0 md:p-0 md:bg-transparent"
          >
            {/* Description - Full width on mobile */}
            <div className="col-span-1 md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">
                Description
              </label>
              <Input
                {...register(`items.${index}.description`)}
                placeholder="Item description"
                error={errors.items?.[index]?.description?.message}
              />
            </div>

            {/* Quantity */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">
                Quantity
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const quantity = parseFloat(e.target.value) || 0;
                    onCalculate(index, quantity, item.unit_price);
                  },
                })}
                placeholder="1.00"
                className="text-right"
                error={errors.items?.[index]?.quantity?.message}
              />
            </div>

            {/* Unit Price */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">
                Unit Price
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.unit_price`, {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const unitPrice = parseFloat(e.target.value) || 0;
                    onCalculate(index, item.quantity, unitPrice);
                  },
                })}
                placeholder="0.00"
                className="text-right"
                leftIcon={<span className="text-gray-500">KES</span>}
                error={errors.items?.[index]?.unit_price?.message}
              />
            </div>

            {/* Total - Display only */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">
                Total
              </label>
              <div className="h-10 px-3 py-2 bg-gray-50 rounded-lg text-right font-medium text-gray-900">
                {formatCurrency(item.total)}
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 md:col-span-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                disabled={items.length === 1}
                title="Remove item"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      <div className="flex items-center justify-center mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onAdd}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Mobile help text */}
      <div className="md:hidden mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Calculator className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Totals are calculated automatically based on quantity and unit price.
          </p>
        </div>
      </div>
    </div>
  );
};