import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '@/lib/expenses';
import { CreateExpenseDTO, ExpenseFilters } from '@/types/expense';

export const useExpenses = (filters?: ExpenseFilters) =>
  useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.getExpenses(filters),
  });

export const useExpense = (id: number) =>
  useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.getExpense(id),
    enabled: !!id,
  });

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseDTO) => expenseApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExpenseDTO> }) =>
      expenseApi.updateExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useExpenseSummary = (month?: string) =>
  useQuery({
    queryKey: ['expense-summary', month],
    queryFn: () => expenseApi.getExpenseSummary(month),
  });
