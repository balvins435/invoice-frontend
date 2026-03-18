import { User } from '@/types';
import api, { setAuthTokens, clearAuthTokens } from './api';
import { ROUTES, sanitizeNextRoute } from './routes';
import { session } from './session';

interface LogoutOptions {
  redirectTo?: string;
}

type ApiErrorPayload = {
  detail?: string;
  message?: string;
  error?: string;
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: ApiErrorPayload;
  };
  request?: unknown;
  message?: string;
  code?: string;
};

const asApiError = (error: unknown): ApiErrorShape =>
  (typeof error === 'object' && error !== null ? (error as ApiErrorShape) : {});

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = asApiError(error);
  const payload = apiError.response?.data;

  if (payload?.detail) return payload.detail;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (apiError.response?.status) return `Server error: ${apiError.response.status}`;
  if (apiError.request) return 'Cannot connect to server. Please check if backend is running.';
  if (apiError.message) return apiError.message;

  return fallback;
};

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private authCheckPromise: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUserFromStorage();
      this.token = session.accessToken;
      
      // Set token in axios defaults if exists
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }

  private loadUserFromStorage() {
    try {
      const userStr = session.rawUser;
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }
  }

  private saveUserToStorage(user: User) {
    if (typeof window !== 'undefined') {
      session.setRawUser(JSON.stringify(user));
      this.user = user;
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('📤 Sending login request...');
      
      const response = await api.post('/login/', {
        email,
        password,
      });
      
      const tokens = response.data;
      console.log('📥 Received tokens');
      
      // Save tokens
      setAuthTokens(tokens);
      this.token = tokens.access;
      
      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      
      // Fetch user profile
      console.log('👤 Fetching user profile...');
      const userResponse = await api.get('/me/');
      const userData = userResponse.data;
      
      console.log('✅ User profile loaded:', userData.email);
      
      // Save user data
      this.saveUserToStorage(userData);
      
      return { 
        success: true, 
        user: userData,
        tokens 
      };
      
    } catch (error: unknown) {
      console.error('❌ Login failed:', error);
      
      return { 
        success: false, 
        error: extractErrorMessage(error, 'Login failed'),
      };
    }
  }

  async register(email: string, password: string, first_name: string, last_name: string) {
    try {
      console.log('📤 Sending registration request...');

      const response = await api.post('/register/', {
        email,
        password,
        first_name,
        last_name,
      });

      const { tokens, ...userData } = response.data || {};

      if (!tokens?.access || !tokens?.refresh) {
        return {
          success: false,
          error: 'Registration succeeded but no tokens were returned.',
        };
      }

      // Save tokens
      setAuthTokens(tokens);
      this.token = tokens.access;

      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;

      // Save user data
      this.saveUserToStorage(userData as User);

      return {
        success: true,
        user: userData as User,
        tokens,
      };
    } catch (error: unknown) {
      console.error('❌ Registration failed:', error);

      return {
        success: false,
        error: extractErrorMessage(error, 'Registration failed'),
      };
    }
  }

  async checkAuth(): Promise<boolean> {
    if (this.authCheckPromise) return this.authCheckPromise;
    this.authCheckPromise = this.performAuthCheck();
    try {
      return await this.authCheckPromise;
    } finally {
      this.authCheckPromise = null;
    }
  }

  private async performAuthCheck(): Promise<boolean> {
    const token = session.accessToken;
    
    if (!token) {
      console.log('No token found');
      this.clearAuth();
      return false;
    }

    // Set token in axios defaults
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.token = token;

    if (session.isAccessTokenExpired()) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.clearAuth();
        return false;
      }
    }
    
    try {
      console.log('🔍 Checking authentication...');
      const response = await api.get('/me/');
      const userData = response.data;
      
      this.saveUserToStorage(userData);
      console.log('✅ Auth check passed for:', userData.email);
      return true;
      
    } catch (error: unknown) {
      const apiError = asApiError(error);
      console.error('❌ Auth check failed:', apiError.response?.status || apiError.message || 'unknown');
      
      // If 401, token is invalid/expired
      if (apiError.response?.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        try {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            const retryResponse = await api.get('/me/');
            const retryUserData = retryResponse.data;
            this.saveUserToStorage(retryUserData);
            console.log('✅ Auth check passed after refresh for:', retryUserData.email);
            return true;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      this.clearAuth();
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = session.refreshToken;
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await api.post('/refresh/', {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      
      // Save new access token
      session.setAccessToken(access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      this.token = access;
      
      console.log('✅ Token refreshed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  async logout(options: LogoutOptions = {}) {
    try {
      const refreshToken = session.refreshToken;
      if (refreshToken) {
        await api.post('/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        const next = sanitizeNextRoute(
          `${window.location.pathname}${window.location.search}`,
          ROUTES.dashboard
        );
        const fallback = `${ROUTES.login}?next=${encodeURIComponent(next)}`;
        const target = options.redirectTo || fallback;
        window.location.replace(target);
      }
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const response = await api.post('/password-reset/', { email }, { timeout: 30000 });
      return { success: true, message: response.data?.detail };
    } catch (error: unknown) {
      let errorMessage = 'Failed to send reset email.';
      const apiError = asApiError(error);
      if (apiError.request) {
        errorMessage = apiError.code === 'ECONNABORTED'
          ? 'Request timed out while sending reset email. Please try again.'
          : 'Request could not be completed. Please try again.';
      } else {
        errorMessage = extractErrorMessage(error, errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }

  async confirmPasswordReset(uid: string, token: string, new_password: string, confirm_password: string) {
    try {
      const response = await api.post('/password-reset/confirm/', {
        uid,
        token,
        new_password,
        confirm_password,
      });
      return { success: true, message: response.data?.detail };
    } catch (error: unknown) {
      return { success: false, error: extractErrorMessage(error, 'Failed to reset password.') };
    }
  }

  clearAuth() {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
    }
    this.user = null;
    this.token = null;
    
    console.log('🧹 Auth cleared');
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export singleton instance
export const authService = new AuthService();
