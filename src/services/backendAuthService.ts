/**
 * Backend Authentication Service
 * 
 * Connects authService to the real Phoenix API backend
 * Makes HTTP calls instead of using demo data
 */

import axios, { AxiosInstance } from 'axios';
import type { User, UserRole } from '../types';
import { loggingService, SecurityEventType } from './loggingService';

export interface BackendLoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  userAgent?: string;
}

export interface BackendLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

export interface BackendSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
}

class BackendAuthService {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
    
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor - handle auth errors
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const newTokens = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', newTokens.accessToken);
              localStorage.setItem('refreshToken', newTokens.refreshToken);

              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear auth data
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Login with backend API
   */
  async login(email: string, password: string): Promise<BackendLoginResponse> {
    try {
      const request: BackendLoginRequest = {
        email,
        password,
        userAgent: navigator.userAgent,
        deviceInfo: navigator.platform,
      };

      const response = await this.client.post<BackendLoginResponse>('/api/auth/login', request);

      loggingService.info('User logged in successfully', {
        userId: response.data.user.id,
        metadata: { email },
      });

      return response.data;
    } catch (error) {
      loggingService.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email },
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }

      throw error;
    }
  }

  /**
   * Signup with backend API
   */
  async signup(data: BackendSignupRequest): Promise<BackendLoginResponse> {
    try {
      const response = await this.client.post<BackendLoginResponse>('/api/auth/signup', data);

      loggingService.info('User signed up successfully', {
        userId: response.data.user.id,
        metadata: { email: data.email, role: data.role },
      });

      return response.data;
    } catch (error) {
      loggingService.error('Signup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email: data.email },
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Signup failed');
      }

      throw error;
    }
  }

  /**
   * Logout with backend API
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
      
      loggingService.info('User logged out successfully');
      
      this.clearAuthData();
    } catch (error) {
      loggingService.warn('Logout request failed, clearing local data anyway', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Clear auth data even if backend call fails
      this.clearAuthData();
    }
  }

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return null;
      }

      const response = await this.client.get<{ user: User }>('/api/auth/me');
      return response.data.user;
    } catch (error) {
      loggingService.warn('Failed to get current user from backend', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await this.client.post<{
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/refresh', { refreshToken });

      return response.data;
    } catch (error) {
      loggingService.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.client.post('/api/auth/request-password-reset', { email });

      loggingService.info('Password reset requested', {
        metadata: { email },
      });
    } catch (error) {
      loggingService.error('Password reset request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email },
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Password reset request failed');
      }

      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.client.post('/api/auth/reset-password', {
        token,
        newPassword,
      });

      loggingService.info('Password reset successfully');
    } catch (error) {
      loggingService.error('Password reset failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Password reset failed');
      }

      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await this.client.patch<{ user: User }>(
        `/api/users/${userId}`,
        updates,
      );

      loggingService.info('User profile updated', {
        userId,
        metadata: { fields: Object.keys(updates) },
      });

      return response.data.user;
    } catch (error) {
      loggingService.error('Profile update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Profile update failed');
      }

      throw error;
    }
  }

  /**
   * Check API availability
   */
  async checkApiAvailability(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch (error) {
      loggingService.warn('Backend API not available', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { apiUrl: this.apiUrl },
      });

      return false;
    }
  }

  /**
   * Get family associations from backend
   */
  async getFamilyAssociations(userId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/users/${userId}/family-associations`);
      return response.data.associations || [];
    } catch (error) {
      loggingService.warn('Failed to get family associations from backend', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });

      return [];
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('familyAssociations');
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Update API URL (for testing)
   */
  updateApiUrl(url: string): void {
    this.apiUrl = url;
    this.client.defaults.baseURL = url;
  }
}

// Singleton instance
export const backendAuthService = new BackendAuthService();

export default backendAuthService;


