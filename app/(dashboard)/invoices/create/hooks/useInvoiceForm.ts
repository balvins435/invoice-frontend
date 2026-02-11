'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { apiService } from '@/lib/api';
import { Business } from '@/types';
import toast from 'react-hot-toast';

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

export const useInvoiceForm = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
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

  useEffect(() => {
    fetchBusinesses();
  }, []);

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
    form.setValue(`items.${index}.total`, total);
    form.setValue('items', [...form.getValues('items')]);
  };

  const addItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [
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
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index));
    } else {
      toast.error('At least one item is required');
    }
  };

  const onSubmit = async (data: InvoiceFormData, status: 'draft' | 'sent' = 'draft') => {
    try {
      setIsSubmitting(true);
      
      const selectedBusiness = businesses.find(b => b.id.toString() === data.business_id);
      
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = selectedBusiness?.tax_rate || 16;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

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

      const response = await apiService.invoices.create(invoiceData);
      
      toast.success(status === 'draft' ? 'Invoice saved as draft!' : 'Invoice created and sent!');
      
      return response.data;
      
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to create invoice');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...form,
    businesses,
    isLoading,
    isSubmitting,
    fetchBusinesses,
    calculateItemTotal,
    addItem,
    removeItem,
    onSubmit,
  };
};