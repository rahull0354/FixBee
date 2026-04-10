import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Simplified config type for our helper methods
type ApiConfig = {
  params?: Record<string, any>;
  [key: string]: any;
};

// Token storage helpers
const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },

  getSessionId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sessionId');
  },

  setTokens: (accessToken: string, refreshToken: string, expiresIn: number, sessionId?: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Store token expiry timestamp
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    // Store session ID if provided
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  },

  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('sessionId');
  },

  isTokenExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    const expiryTime = localStorage.getItem('tokenExpiry');
    if (!expiryTime) return true;
    return Date.now() > parseInt(expiryTime);
  },

  getUserRole: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userRole');
  },
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add access token to Authorization header
        const accessToken = TokenManager.getAccessToken();
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error: AxiosError) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Handle backend response format: { message, success, data }
        const backendResponse = response.data as any;

        // If success is false, create an error but preserve axios structure
        if (backendResponse.success === false) {
          const error: any = new Error(backendResponse.message || 'Request failed');
          error.config = response.config;
          error.response = {
            ...response,
            data: backendResponse
          };
          error.isAxiosError = true;
          throw error;
        }

        // Check if this is an auth endpoint (login, register, refresh-token)
        // Auth endpoints need the full response including tokens
        const isAuthEndpoint = response.config?.url?.includes('/login') ||
                               response.config?.url?.includes('/register') ||
                               response.config?.url?.includes('/refresh-token');

        if (isAuthEndpoint) {
          // Return the full backend response for auth endpoints
          return {
            ...response,
            data: backendResponse
          };
        }

        // For non-auth endpoints, extract the actual data
        const data = backendResponse.data || backendResponse.user || backendResponse.customer || backendResponse.provider || backendResponse.author || backendResponse.serviceProvider || backendResponse.review;

        return {
          ...response,
          data: data !== undefined ? data : backendResponse
        };
      },
      async (error: AxiosError | any) => {
        const originalRequest = error.config;

        // Handle 401 errors
        if (error.response?.status === 401) {
          // Try to refresh token (if not already retrying)
          if (!originalRequest._retry) {
            if (this.isRefreshing) {
              // If already refreshing, wait for the new token
              return new Promise((resolve) => {
                this.subscribeTokenRefresh((token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                });
              });
            }

            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              const refreshToken = TokenManager.getRefreshToken();
              const userRole = TokenManager.getUserRole();

              if (!refreshToken || !userRole) {
                throw new Error('No refresh token available');
              }

              // Call appropriate refresh endpoint based on role
              let refreshEndpoint;
              switch (userRole) {
                case 'customer':
                  refreshEndpoint = '/customers/refresh-token';
                  break;
                case 'provider':
                  refreshEndpoint = '/providers/refresh-token';
                  break;
                case 'admin':
                  refreshEndpoint = '/author/refresh-token';
                  break;
                default:
                  throw new Error('Invalid user role');
              }

              const response = await axios.post(`${API_URL}${refreshEndpoint}`, { refreshToken });
              const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

              // Store new tokens (token rotation)
              TokenManager.setTokens(accessToken, newRefreshToken, expiresIn);

              // Update Authorization header
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;

              // Notify all waiting requests
              this.onTokenRefreshed(accessToken);

              // Retry original request
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed - clear tokens and redirect to login
              TokenManager.clearTokens();
              this.onTokenRefreshed(''); // Clear waiting requests

              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
              }

              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
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
export { TokenManager };
