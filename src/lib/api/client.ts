import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Simplified config type for our helper methods
type ApiConfig = {
  params?: Record<string, any>;
  [key: string]: any;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for httpOnly cookies
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Try to get token from cookie as fallback for Authorization header
        // Some backends expect Authorization header even with cookies
        if (typeof document !== 'undefined') {
          const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
          };

          const token = getCookie('auth_token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - unwrap backend response format
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Handle backend response format: { message, success, data }
        const backendResponse = response.data as any;

        // If success is false, create an error but preserve axios structure
        if (backendResponse.success === false) {
          const error: any = new Error(backendResponse.message || 'Request failed');
          // Preserve all axios error properties
          error.config = response.config;
          error.response = {
            ...response,
            data: backendResponse
          };
          error.isAxiosError = true;
          throw error;
        }

        // Extract the actual data from the backend response
        // Backend sends: { message, success, user/data/customer/provider/author }
        // We want to return the actual data (user, customer, etc)
        const data = backendResponse.data || backendResponse.user || backendResponse.customer || backendResponse.provider || backendResponse.author;

        // Return the data in the expected format
        return {
          ...response,
          data: data !== undefined ? data : backendResponse
        };
      },
      (error: AxiosError | any) => {
        if (error?.response?.status === 401) {
          // Token expired or invalid
          // Could trigger a refresh or redirect to login
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/forgot-password')) {
              // Redirect to login page preserving the intended destination
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  // Helper methods for common HTTP methods
  public async get<T>(url: string, config?: ApiConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: ApiConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: ApiConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: ApiConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: ApiConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
