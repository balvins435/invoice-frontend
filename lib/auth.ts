import { User } from '@/types';
import api, { setAuthTokens, clearAuthTokens } from './api';

class AuthService {
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUserFromStorage();
      this.token = localStorage.getItem('access_token');
      
      // Set token in axios defaults if exists
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }

  private loadUserFromStorage() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }
  }

  private saveUserToStorage(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
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
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage 
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
    } catch (error: any) {
      console.error('❌ Registration failed:', error);

      let errorMessage = 'Registration failed';

      if (error.response) {
        errorMessage = error.response.data?.detail ||
                      error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async checkAuth(): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('No token found');
      this.clearAuth();
      return false;
    }

    // Set token in axios defaults
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.token = token;
    
    try {
      console.log('🔍 Checking authentication...');
      const response = await api.get('/me/');
      const userData = response.data;
      
      this.saveUserToStorage(userData);
      console.log('✅ Auth check passed for:', userData.email);
      return true;
      
    } catch (error: any) {
      console.error('❌ Auth check failed:', error.response?.status || error.message);
      
      // If 401, token is invalid/expired
      if (error.response?.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        try {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry auth check
            return this.checkAuth();
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
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await api.post('/refresh/', {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      
      // Save new access token
      localStorage.setItem('access_token', access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      this.token = access;
      
      console.log('✅ Token refreshed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const response = await api.post('/password-reset/', { email }, { timeout: 30000 });
      return { success: true, message: response.data?.detail };
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email.';
      if (error.response) {
        errorMessage = error.response.data?.detail ||
                      error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = error.code === 'ECONNABORTED'
          ? 'Request timed out while sending reset email. Please try again.'
          : 'Request could not be completed. Please try again.';
      } else {
        errorMessage = error.message;
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
    } catch (error: any) {
      let errorMessage = 'Failed to reset password.';
      if (error.response) {
        errorMessage = error.response.data?.detail ||
                      error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      } else {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  }

  clearAuth() {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      
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
