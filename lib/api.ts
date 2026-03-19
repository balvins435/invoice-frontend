import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { ROUTES, sanitizeNextRoute } from './routes';
import { session } from './session';
type TokenRefreshResponse = { access: string };
type JsonPayload = Record<string, unknown>;
type QueryParams = object;
type RequestBody = JsonPayload | FormData;

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  const next = sanitizeNextRoute(`${window.location.pathname}${window.location.search}`, ROUTES.dashboard);
  const target = `${ROUTES.login}?next=${encodeURIComponent(next)}`;
  if (window.location.pathname !== ROUTES.login) {
    window.location.replace(target);
  }
};

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
  (config: InternalAxiosRequestConfig) => {
    const token = session.accessToken;
    
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    const isFormDataRequest =
      typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormDataRequest) {
      config.headers.delete('Content-Type');
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
    const originalRequest = error.config as RetriableRequestConfig;
    if (!originalRequest) return Promise.reject(error);

    const isAuthEndpoint = ['/login/', '/register/', '/refresh/', '/logout/']
      .some((path) => originalRequest.url?.includes(path));
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = session.refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Attempt to refresh the token
        if (!refreshInFlight) {
          refreshInFlight = axios
            .post<TokenRefreshResponse>(`${API_URL}/refresh/`, { refresh: refreshToken })
            .then((response) => {
              const { access } = response.data;
              session.setAccessToken(access);
              return access;
            })
            .catch(() => null)
            .finally(() => {
              refreshInFlight = null;
            });
        }

        const access = await refreshInFlight;
        if (!access) {
          throw new Error('Refresh token request failed');
        }
        
        // Update the original request with new token
        if (typeof originalRequest.headers?.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${access}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${access}`;
        }
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        session.clear();
        redirectToLogin();
        
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
    register: (data: RequestBody) => api.post('/register/', data),
    login: (data: RequestBody) => api.post('/login/', data),
    logout: (p0: { refresh: string; }) => api.post('/logout/', p0),
    getCurrentUser: () => api.get('/me/'),
    refreshToken: (refresh: string) => 
      api.post('/refresh/', { refresh }),
    changePassword: (data: RequestBody) => 
      api.put('/me/change-password/', data),
    updateProfile: (data: RequestBody) => 
      api.patch('/me/update-profile/', data),
  },

  // Business endpoints
  business: {
    getAll: () => api.get('/business/'),
    getById: (id: number) => api.get(`/business/${id}/`),
    create: (data: RequestBody) => api.post('/business/', data),
    update: (id: number, data: RequestBody) => api.patch(`/business/${id}/`, data),
    delete: (id: number) => api.delete(`/business/${id}/`),
  },

  // Invoice endpoints
  invoices: {
    getAll: (params?: QueryParams) => api.get('/invoice/', { params }),
    getById: (id: number) => api.get(`/invoice/${id}/`),
    create: (data: RequestBody) => api.post('/invoice/', data),
    update: (id: number, data: RequestBody) => api.patch(`/invoice/${id}/`, data),
    delete: (id: number) => api.delete(`/invoice/${id}/`),
    markAsPaid: (id: number) => api.post(`/invoice/${id}/mark_paid/`),
    sendEmail: (id: number) => api.post(`/invoice/${id}/send_email/`),
    downloadPDF: (id: number) => 
      api.get(`/invoice/${id}/pdf/`, { responseType: 'blob' }),
    downloadReceipt: (id: number) =>
      api.get(`/invoice/${id}/receipt/`, { responseType: 'blob' }),
  },

  // Expense endpoints
  expenses: {
    getAll: (params?: QueryParams) => api.get('/expenses/', { params }),
    getById: (id: number) => api.get(`/expenses/${id}/`),
    create: (data: RequestBody) => api.post('/expenses/', data),
    update: (id: number, data: RequestBody) => api.patch(`/expenses/${id}/`, data),
    delete: (id: number) => api.delete(`/expenses/${id}/`),
    getCategories: () => api.get('/expenses/categories/'),
  },

  // Payments endpoints
  payments: {
    getTransactions: (params?: QueryParams) => api.get('/payments/transactions/', { params }),
    getTransactionById: (id: number) => api.get(`/payments/transactions/${id}/`),
    initiateStkPush: (data: { invoice_id: number; phone_number: string; amount?: string | number }) =>
      api.post('/payments/transactions/initiate-stk/', data),
    confirmTransaction: (
      id: number,
      data: { success: boolean; result_code?: string; result_description?: string; mpesa_receipt_number?: string }
    ) => api.post(`/payments/transactions/${id}/confirm/`, data),
  },

  // Messaging endpoints
  messaging: {
    getWhatsAppMessages: (params?: QueryParams) => api.get('/messaging/whatsapp/', { params }),
    sendInvoiceWhatsApp: (data: { invoice_id: number; phone_number: string; message?: string }) =>
      api.post('/messaging/whatsapp/send-invoice/', data),
  },

  // Tax endpoints
  tax: {
    getSubmissions: (params?: QueryParams) => api.get('/tax/submissions/', { params }),
    submitInvoice: (data: { invoice_id: number }) => api.post('/tax/submissions/submit-invoice/', data),
  },

  // Report endpoints
  reports: {
    getMonthlyReport: (params: QueryParams) => 
      api.get('/reports/monthly/', { params }),
    getTaxSummary: (params: QueryParams) => 
      api.get('/reports/tax-summary/', { params }),
    getDashboardStats: (params: QueryParams) => api.get('/reports/dashboard-stats/', { params }),
    downloadPDF: (params: QueryParams) =>
      api.get('/reports/pdf/', { params, responseType: 'blob' }),
  },
};

// Helper functions
export const setAuthTokens = (tokens: { access: string; refresh: string }) => {
  session.setTokens(tokens.access, tokens.refresh);
};

export const clearAuthTokens = () => {
  session.clear();
};

export const getAuthHeaders = () => {
  const token = session.accessToken;
  return {
    Authorization: `Bearer ${token}`,
  };
};

export default api;
