import { User, AuthResponse } from '@/types';
import { apiService, clearAuthTokens, setAuthTokens } from './api';

class AuthService {
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
      this.token = localStorage.getItem('access_token');
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.clearAuth();
    }
  }

  private saveUserToStorage(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.user = user;
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    try {
      const response = await apiService.auth.register({
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
      });

      const { user, tokens } = response.data;
      setAuthTokens(tokens);
      this.saveUserToStorage(user);

      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await apiService.auth.login({
        email,
        password,
      });

      const { user, tokens } = response.data;
      setAuthTokens(tokens);
      this.saveUserToStorage(user);

      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiService.auth.logout({ refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiService.auth.getCurrentUser();
      const user = response.data;
      this.saveUserToStorage(user);
      return { success: true, user };
    } catch (error: any) {
      this.clearAuth();
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch user' 
      };
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.auth.refreshToken(refreshToken);
      const { access } = response.data.tokens;
      localStorage.setItem('access_token', access);
      this.token = access;

      return { success: true, token: access };
    } catch (error: any) {
      this.clearAuth();
      return { 
        success: false, 
        error: error.response?.data?.error || 'Token refresh failed' 
      };
    }
  }

  clearAuth() {
    clearAuthTokens();
    this.user = null;
    this.token = null;
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

  async checkAuth(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();