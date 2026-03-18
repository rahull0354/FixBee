import { apiClient } from './client';
import { LoginCredentials, RegisterCustomerData, RegisterProviderData, AuthResponse } from '@/types/auth';

export const authApi = {
  // Customer Auth
  customerLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/customers/login', credentials);
  },

  customerRegister: async (data: RegisterCustomerData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/customers/register', data);
  },

  customerLogout: async (): Promise<void> => {
    return apiClient.post('/customers/logout');
  },

  // Provider Auth
  providerLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/providers/login', credentials);
  },

  providerRegister: async (data: RegisterProviderData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/providers/register', data);
  },

  providerLogout: async (): Promise<void> => {
    return apiClient.post('/providers/logout');
  },

  // Admin Auth
  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/author/login', credentials);
  },

  adminLogout: async (): Promise<void> => {
    return apiClient.post('/author/logout');
  },
};
