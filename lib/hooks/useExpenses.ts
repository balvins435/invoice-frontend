import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '@/lib/api/expenses';
import { CreateExpenseDTO, ExpenseFilters } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { useBusiness } from './useBusiness';

export const useExpenses = (filters?: ExpenseFilters) => {
  const { toast } = useToast();
  const { currentBusiness } = useBusiness();
  
  return useQuery({
    queryKey: ['expenses', currentBusiness?.id, filters],
    queryFn: () => expenseApi.getExpenses(filters),
    enabled: !!currentBusiness?.id,
  });
};

export const useExpense = (id: number) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.getExpense(id),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentBusiness } = useBusiness();

  return useMutation({
    mutationFn: (data: CreateExpenseDTO) => expenseApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentBusiness?.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      toast({
        title: 'Success',
        description: 'Expense created successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create expense',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExpenseDTO> }) =>
      expenseApi.updateExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
        variant: 'success',
      });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
        variant: 'success',
      });
    },
  });
};

export const useExpenseSummary = (month?: string) => {
  const { currentBusiness } = useBusiness();
  
  return useQuery({
    queryKey: ['expense-summary', currentBusiness?.id, month],
    queryFn: () => expenseApi.getExpenseSummary(month),
    enabled: !!currentBusiness?.id,
  });
};