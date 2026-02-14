import api from './api';
import { Expense, CreateExpenseDTO, ExpenseFilters, ExpenseSummary } from '@/types/expense';

const BASE_URL = '/expenses';

export const expenseApi = {
  // Get all expenses for current business
  getExpenses: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tax_deductible !== undefined) 
      params.append('tax_deductible', String(filters.tax_deductible));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`${BASE_URL}/?${params.toString()}`);
    return response.data;
  },

  // Get single expense
  getExpense: async (id: number): Promise<Expense> => {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Create new expense
  createExpense: async (data: CreateExpenseDTO): Promise<Expense> => {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('amount', String(data.amount));
    formData.append('expense_date', data.expense_date);
    formData.append('tax_deductible', String(data.tax_deductible));
    
    if (data.notes) formData.append('notes', data.notes);
    if (data.receipt) formData.append('receipt', data.receipt);
    
    const response = await api.post(`${BASE_URL}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update expense
  updateExpense: async (id: number, data: Partial<CreateExpenseDTO>): Promise<Expense> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'receipt' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'receipt') {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await api.patch(`${BASE_URL}/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}/`);
  },

  // Get expense summary
  getExpenseSummary: async (month?: string): Promise<ExpenseSummary> => {
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`${BASE_URL}/summary/${params}`);
    return response.data;
  },

  // Export expenses to CSV
  exportExpenses: async (filters?: ExpenseFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);
    
    const response = await api.get(`${BASE_URL}/export/?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Upload receipt
  uploadReceipt: async (id: number, file: File): Promise<Expense> => {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post(`${BASE_URL}/${id}/upload-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
