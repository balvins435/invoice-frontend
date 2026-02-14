'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Camera, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types/expense';
import { useCreateExpense, useUpdateExpense } from '@/lib/hooks/useExpenses';

// Form validation schema
const expenseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  expense_date: z.date(),
  tax_deductible: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: ExpenseFormData;
  expenseId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  expenseId,
  onSuccess,
  onCancel,
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(initialData?.expense_date || new Date());

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData || {
      title: '',
      category: '',
      amount: 0,
      expense_date: new Date(),
      tax_deductible: true,
      notes: '',
    },
  });

  const selectedCategory = watch('category');
  const isTaxDeductible = watch('tax_deductible');

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const formattedData = {
        ...data,
        category: data.category as keyof typeof EXPENSE_CATEGORIES,
        expense_date: format(data.expense_date, 'yyyy-MM-dd'),
        amount: Number(data.amount),
        receipt: receiptFile || undefined,
      };

      if (expenseId) {
        await updateExpense.mutateAsync({ id: expenseId, data: formattedData });
      } else {
        await createExpense.mutateAsync(formattedData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal
    const numeric = value.replace(/[^0-9.]/g, '');
    
    // Format with commas for thousands
    if (numeric) {
      const parts = numeric.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {expenseId ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <p className="text-muted-foreground">
            {expenseId 
              ? 'Update your expense details' 
              : 'Record a new business expense'
            }
          </p>
        </div>
        {expenseId && (
          <Badge variant={isTaxDeductible ? 'default' : 'secondary'}>
            {isTaxDeductible ? 'Tax Deductible' : 'Non-Deductible'}
          </Badge>
        )}
      </div>

      {/* Main Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Expense Title *
              </label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Office Rent, Internet Bill"
                className={cn(errors.title && 'border-red-500')}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category *
              </label>
              <select
                id="category"
                {...register('category')}
                className={cn(
                  'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                  'focus:border-primary-500 focus:outline-none',
                  errors.category && 'border-red-500'
                )}
              >
                <option value="">Select a category</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  KES
                </span>
                <Input
                  id="amount"
                  type="text"
                  {...register('amount', {
                    setValueAs: (v) => {
                      if (typeof v === 'string') {
                        return parseFloat(v.replace(/,/g, '')) || 0;
                      }
                      return v;
                    },
                  })}
                  placeholder="0.00"
                  className={cn('pl-12', errors.amount && 'border-red-500')}
                  onChange={(e) => {
                    const formatted = formatAmount(e.target.value);
                    e.target.value = formatted;
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label htmlFor="expense_date" className="text-sm font-medium">
                Expense Date *
              </label>
              <Input
                id="expense_date"
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const nextDate = new Date(e.target.value);
                  if (!Number.isNaN(nextDate.getTime())) {
                    setDate(nextDate);
                    setValue('expense_date', nextDate);
                  }
                }}
              />
            </div>

            {/* Tax Deductible Switch */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label htmlFor="tax-deductible" className="text-sm font-medium">
                  Tax Deductible
                </label>
                <p className="text-sm text-muted-foreground">
                  This expense can be deducted from your taxable income
                </p>
              </div>
              <input
                id="tax-deductible"
                type="checkbox"
                checked={isTaxDeductible}
                onChange={(e) => setValue('tax_deductible', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Add any additional details about this expense..."
                className="min-h-[120px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Receipt (Optional)</p>
              <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6">
                {receiptPreview ? (
                  <div className="relative w-full">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="max-h-[200px] w-full rounded-lg object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, PDF (max 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Category Tips */}
            {selectedCategory && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <h4 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                  💡 Category Tip
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {getCategoryTip(selectedCategory)}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : expenseId ? (
                'Update Expense'
              ) : (
                'Save Expense'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

// Helper function for category tips
function getCategoryTip(category: string): string {
  const tips: Record<string, string> = {
    rent: 'Rent and utility expenses are typically 100% tax deductible for businesses.',
    salaries: 'Employee salaries and wages are fully tax deductible when properly documented.',
    supplies: 'Office supplies under KES 50,000 can be fully expensed in the current year.',
    transport: 'Keep a log of business vs. personal use for vehicle expenses.',
    airtime: 'Business communication expenses are fully tax deductible with receipts.',
    marketing: 'Marketing and advertising costs are fully deductible business expenses.',
    equipment: 'Equipment over KES 100,000 should be capitalized and depreciated.',
    maintenance: 'Repairs and maintenance are fully deductible in the current year.',
    professional: 'Legal and professional fees are 100% tax deductible.',
    tax: 'Business licenses, permits, and certain taxes are deductible.',
    inventory: 'Cost of goods sold is deductible when inventory is sold.',
    other: 'Ensure you keep detailed receipts for audit purposes.',
  };
  
  return tips[category] || 'Keep all receipts for tax purposes and audit trail.';
}
