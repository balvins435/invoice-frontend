'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Building2, User, Mail, Plus, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceSummary } from './InvoiceSummary';
import { apiService } from '@/lib/api';
import { Business } from '@/types';
import { cn } from '@/lib/utils';

// Form validation schema
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

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const InvoiceForm: React.FC = () => {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      business_id: '',
      client_name: '',
      client_email: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
        },
      ],
      status: 'draft',
    },
  });

  // Watch form values
  const items = watch('items');
  const businessId = watch('business_id');

  // Fetch user's businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Update selected business when business_id changes
  useEffect(() => {
    if (businessId && businesses.length > 0) {
      const business = businesses.find(b => b.id.toString() === businessId);
      setSelectedBusiness(business || null);
    }
  }, [businessId, businesses]);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.business.getAll();
      setBusinesses(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateItemTotal = (index: number, quantity: number, unitPrice: number) => {
    const total = quantity * unitPrice;
    setValue(`items.${index}.total`, total);
    
    // Trigger form update
    setValue('items', [...items]);
  };

  const addItem = () => {
    setValue('items', [
      ...items,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setValue('items', newItems);
    } else {
      toast.error('At least one item is required');
    }
  };

  const onSubmit = async (data: InvoiceFormData, status: 'draft' | 'sent' = 'draft') => {
    try {
      setIsSubmitting(true);
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = selectedBusiness?.tax_rate || 16;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Prepare invoice data
      const invoiceData = {
        ...data,
        business_id: parseInt(data.business_id),
        subtotal: Number(subtotal.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        status,
        items: data.items.map(item => ({
          ...item,
          total: Number(item.total.toFixed(2)),
        })),
      };

      console.log('Submitting invoice:', invoiceData);

      const response = await apiService.invoices.create(invoiceData);
      
      toast.success(
        status === 'draft' 
          ? 'Invoice saved as draft!' 
          : 'Invoice created and sent!'
      );
      
      // Redirect to invoice view page
      setTimeout(() => {
        router.push(`/dashboard/invoices/${response.data.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="invoice-form" onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))}>
      <div className="space-y-8">
        {/* Business Selection */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-gray-600" />
            Business Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Business <span className="text-danger-500">*</span>
              </label>
              <select
                {...register('business_id')}
                className={cn(
                  'input-primary',
                  errors.business_id && 'border-danger-500 focus:ring-danger-500'
                )}
                disabled={isLoading}
              >
                <option value="">Choose a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.business_name}
                  </option>
                ))}
              </select>
              {errors.business_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.business_id.message}</p>
              )}
            </div>

            {selectedBusiness && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-primary-700 font-medium">Tax Rate</p>
                <p className="text-lg font-semibold text-primary-800">
                  {selectedBusiness.tax_rate}% VAT
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-600" />
            Client Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Client Name *"
              {...register('client_name')}
              error={errors.client_name?.message}
              placeholder="e.g., John Doe or Company Name"
              leftIcon={<User className="h-5 w-5" />}
            />
            
            <Input
              label="Client Email"
              type="email"
              {...register('client_email')}
              error={errors.client_email?.message}
              placeholder="client@example.com"
              leftIcon={<Mail className="h-5 w-5" />}
              helperText="Required for sending invoice via email"
            />
          </div>
        </div>

        {/* Invoice Dates */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Invoice Dates
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Issue Date *"
              type="date"
              {...register('issue_date')}
              error={errors.issue_date?.message}
            />
            
            <Input
              label="Due Date *"
              type="date"
              {...register('due_date')}
              error={errors.due_date?.message}
              helperText="Usually 14-30 days from issue date"
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Invoice Items</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add the products or services you're billing for
            </p>
          </div>
          
          <div className="p-6">
            <InvoiceItemsTable
              items={items}
              register={register}
              errors={errors}
              onCalculate={calculateItemTotal}
              onAdd={addItem}
              onRemove={removeItem}
            />
          </div>
        </div>

        {/* Invoice Summary */}
        <InvoiceSummary 
          items={items}
          taxRate={selectedBusiness?.tax_rate || 16}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, 'sent'))}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            Create & Send Invoice
          </Button>
        </div>
      </div>
    </form>
  );
};