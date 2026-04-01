import { apiClient } from './client';
import { Category, CreateCategoryData, UpdateCategoryData, ProviderProfile, Review, PaginatedResponse, Invoice, Payment } from '@/types';

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    return apiClient.get('/author/dashboard');
  },

  getServiceDistribution: async () => {
    return apiClient.get('/author/service-distribution');
  },

  getRevenueDistribution: async () => {
    return apiClient.get('/author/revenue-distribution');
  },

  getServiceEarnings: async (requestId: string) => {
    return apiClient.get(`/author/service-earnings/${requestId}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/author/categories');
  },

  getCategory: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/author/category/${id}`);
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    return apiClient.get<Category>(`/author/category/slug/${slug}`);
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    return apiClient.post<Category>('/author/createCategory', data);
  },

  updateCategory: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    return apiClient.put<Category>(`/author/category/update/${id}`, data);
  },

  toggleCategoryStatus: async (id: string): Promise<Category> => {
    return apiClient.patch<Category>(`/author/category/${id}/toggle`);
  },

  deleteCategory: async (id: string): Promise<void> => {
    return apiClient.delete(`/author/category/delete/${id}`);
  },

  // Service Providers
  getProviders: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<ProviderProfile>> => {
    const config = params ? { params } : undefined;
    return apiClient.get<PaginatedResponse<ProviderProfile>>('/author/serviceProviders', config);
  },

  getProvider: async (id: string): Promise<ProviderProfile> => {
    return apiClient.get<ProviderProfile>(`/author/serviceProvider/${id}`);
  },

  suspendProvider: async (id: string, suspensionReason: string): Promise<ProviderProfile> => {
    return apiClient.patch<ProviderProfile>(`/author/serviceProvider/suspend/${id}`, { suspensionReason });
  },

  unsuspendProvider: async (id: string): Promise<ProviderProfile> => {
    return apiClient.patch<ProviderProfile>(`/author/serviceProvider/un-suspend/${id}`);
  },

  // Customers
  getCustomers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/author/customers', config);
  },

  getCustomer: async (id: string) => {
    return apiClient.get(`/author/customer/${id}`);
  },

  // Profile
  getProfile: async () => {
    return apiClient.get('/author/profile');
  },

  // Reviews
  getAllReviews: async (params?: { flagged?: boolean; visible?: boolean; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Review>> => {
    const config = params ? { params } : undefined;
    return apiClient.get<PaginatedResponse<Review>>('/review/admin/all-reviews', config);
  },

  getReview: async (id: string): Promise<Review> => {
    return apiClient.get<Review>(`/review/admin/${id}`);
  },

  flagReview: async (id: string, data: { reason: string; hide: boolean }): Promise<Review> => {
    return apiClient.patch<Review>(`/review/admin/flag/${id}`, data);
  },

  unflagReview: async (id: string): Promise<Review> => {
    return apiClient.patch<Review>(`/review/admin/un-flag/${id}`);
  },

  toggleReviewVisibility: async (id: string, isVisible: boolean): Promise<Review> => {
    return apiClient.patch<Review>(`/review/admin/visibility/${id}`, { isVisible });
  },

  // Payments & Invoices
  getPaymentStats: async () => {
    return apiClient.get('/payments/stats');
  },

  getAllPayments: async (params?: { page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/payments/history', config);
  },

  getPayment: async (paymentId: string) => {
    return apiClient.get(`/payments/${paymentId}/status`);
  },

  // Note: Invoice endpoints
  getAllInvoices: async (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/invoices', config);
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    return apiClient.get(`/invoices/${id}`);
  },
};
