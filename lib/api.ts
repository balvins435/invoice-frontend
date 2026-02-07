import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Attempt to refresh the token
        const response = await axios.post<AuthResponse>(
          `${API_URL}/users/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const { access } = response.data.tokens;
        
        // Save new access token
        localStorage.setItem('access_token', access);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  // Auth endpoints
  auth: {
    register: (data: any) => api.post('/users/register/', data),
    login: (data: any) => api.post('/users/login/', data),
    logout: () => api.post('/users/logout/'),
    getCurrentUser: () => api.get('/users/me/'),
    refreshToken: (refresh: string) => 
      api.post('/users/token/refresh/', { refresh }),
    changePassword: (data: any) => 
      api.put('/users/me/change-password/', data),
    updateProfile: (data: any) => 
      api.patch('/users/me/update-profile/', data),
  },

  // Business endpoints
  business: {
    getAll: () => api.get('/business/'),
    getById: (id: number) => api.get(`/business/${id}/`),
    create: (data: any) => api.post('/business/', data),
    update: (id: number, data: any) => api.patch(`/business/${id}/`, data),
    delete: (id: number) => api.delete(`/business/${id}/`),
  },

  // Invoice endpoints
  invoices: {
    getAll: (params?: any) => api.get('/invoices/', { params }),
    getById: (id: number) => api.get(`/invoices/${id}/`),
    create: (data: any) => api.post('/invoices/', data),
    update: (id: number, data: any) => api.patch(`/invoices/${id}/`, data),
    delete: (id: number) => api.delete(`/invoices/${id}/`),
    markAsPaid: (id: number) => api.post(`/invoices/${id}/mark-paid/`),
    sendEmail: (id: number) => api.post(`/invoices/${id}/send-email/`),
    downloadPDF: (id: number) => 
      api.get(`/invoices/${id}/download-pdf/`, { responseType: 'blob' }),
  },

  // Expense endpoints
  expenses: {
    getAll: (params?: any) => api.get('/expenses/', { params }),
    getById: (id: number) => api.get(`/expenses/${id}/`),
    create: (data: any) => api.post('/expenses/', data),
    update: (id: number, data: any) => api.patch(`/expenses/${id}/`, data),
    delete: (id: number) => api.delete(`/expenses/${id}/`),
    getCategories: () => api.get('/expenses/categories/'),
  },

  // Report endpoints
  reports: {
    getMonthlyReport: (params: any) => 
      api.get('/reports/monthly/', { params }),
    getTaxSummary: (params: any) => 
      api.get('/reports/tax-summary/', { params }),
    getDashboardStats: () => api.get('/reports/dashboard-stats/'),
  },
};

// Helper functions
export const setAuthTokens = (tokens: { access: string; refresh: string }) => {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export default api;