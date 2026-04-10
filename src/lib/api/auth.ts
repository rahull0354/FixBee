import { apiClient } from './client';
import {
  LoginCredentials,
  RegisterCustomerData,
  RegisterProviderData,
  AuthResponse,
  RefreshTokenResponse,
  SessionsResponse,
  LogoutResponse,
  LogoutAllResponse,
  RevokeSessionResponse,
} from '@/types/auth';

export const authApi = {
  // Customer Auth
  customerLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/customers/login', credentials);
  },

  customerRegister: async (data: RegisterCustomerData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/customers/register', data);
  },

  customerRefreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>('/customers/refresh-token', { refreshToken });
  },

  customerLogout: async (refreshToken: string): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/customers/logout', { refreshToken });
  },

  customerGetSessions: async (): Promise<SessionsResponse> => {
    return apiClient.get<SessionsResponse>('/customers/sessions');
  },

  customerRevokeSession: async (sessionId: string): Promise<RevokeSessionResponse> => {
    return apiClient.delete<RevokeSessionResponse>(`/customers/sessions/${sessionId}`);
  },

  customerLogoutAll: async (): Promise<LogoutAllResponse> => {
    return apiClient.post<LogoutAllResponse>('/customers/logout-all');
  },

  // Provider Auth
  providerLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/providers/login', credentials);
  },

  providerRegister: async (data: RegisterProviderData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/providers/register', data);
  },

  providerRefreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>('/providers/refresh-token', { refreshToken });
  },

  providerLogout: async (refreshToken: string): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/providers/logout', { refreshToken });
  },

  providerGetSessions: async (): Promise<SessionsResponse> => {
    return apiClient.get<SessionsResponse>('/providers/sessions');
  },

  providerRevokeSession: async (sessionId: string): Promise<RevokeSessionResponse> => {
    return apiClient.delete<RevokeSessionResponse>(`/providers/sessions/${sessionId}`);
  },

  providerLogoutAll: async (): Promise<LogoutAllResponse> => {
    return apiClient.post<LogoutAllResponse>('/providers/logout-all');
  },

  // Admin Auth
  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/author/login', credentials);
  },

  adminRegister: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/author/register', data);
  },

  adminRefreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>('/author/refresh-token', { refreshToken });
  },

  adminLogout: async (refreshToken: string): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/author/logout', { refreshToken });
  },

  adminGetSessions: async (): Promise<SessionsResponse> => {
    return apiClient.get<SessionsResponse>('/author/sessions');
  },

  adminRevokeSession: async (sessionId: string): Promise<RevokeSessionResponse> => {
    return apiClient.delete<RevokeSessionResponse>(`/author/sessions/${sessionId}`);
  },

  adminLogoutAll: async (): Promise<LogoutAllResponse> => {
    return apiClient.post<LogoutAllResponse>('/author/logout-all');
  },
};
