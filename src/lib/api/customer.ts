import { apiClient } from './client';
import { ServiceRequest, CreateServiceRequestData, UpdateServiceRequestData, Review, CreateReviewData, UpdateReviewData, Notification, NotificationPreferences } from '@/types';

export const customerApi = {
  // Profile
  getProfile: async () => {
    return apiClient.get('/customers/profile');
  },

  updateProfile: async (data: any) => {
    return apiClient.put('/customers/update-profile', data);
  },

  deactivateAccount: async () => {
    return apiClient.post('/customers/deactivate-account');
  },

  requestReactivation: async (email?: string) => {
    return apiClient.post('/customers/request-reactivation', { email });
  },

  verifyReactivation: async (token: string) => {
    return apiClient.get(`/customers/reactivate-account/${token}`);
  },

  // Service Requests
  createServiceRequest: async (data: CreateServiceRequestData): Promise<ServiceRequest> => {
    return apiClient.post('/request/create', data);
  },

  getMyServiceRequests: async (params?: { status?: string; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/request/requests/my-services', config);
  },

  getServiceRequest: async (id: string): Promise<ServiceRequest> => {
    return apiClient.get(`/request/customer/service-request/${id}`);
  },

  cancelServiceRequest: async (id: string, reason: string) => {
    return apiClient.patch(`/request/cancel/${id}`, { cancellationReason: reason });
  },

  rescheduleServiceRequest: async (id: string, data: UpdateServiceRequestData) => {
    return apiClient.patch(`/request/reschedule/${id}`, data);
  },

  // Reviews
  getMyReviews: async () => {
    return apiClient.get<Review[]>('/review/customer/my-reviews');
  },

  createReview: async (requestId: string, data: Omit<CreateReviewData, 'requestId'>) => {
    return apiClient.post(`/review/create/${requestId}`, data);
  },

  updateReview: async (id: string, data: UpdateReviewData) => {
    return apiClient.patch(`/review/customer/edit-review/${id}`, data);
  },

  deleteReview: async (id: string) => {
    return apiClient.delete(`/review/customer/delete/${id}`);
  },

  // Categories
  getCategories: async () => {
    return apiClient.get('/author/categories');
  },

  getCategory: async (slug: string) => {
    return apiClient.get(`/author/category/slug/${slug}`);
  },

  // Providers
  getProviders: async (params?: { city?: string; skills?: string; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/providers/list', config);
  },

  getProvidersByCategory: async (categoryId: string, city?: string) => {
    const params: any = { categoryId };
    if (city) params.city = city;
    return apiClient.get('/providers/by-category', { params });
  },

  getProvider: async (id: string) => {
    return apiClient.get(`/providers/list/profile/${id}`);
  },

  // Notifications
  getNotifications: async (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get<{ notifications: Notification[]; total: number; unreadCount: number }>('/customers/notifications', config);
  },

  markAsRead: async (id: string) => {
    return apiClient.patch(`/customers/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/customers/notifications/read-all');
  },

  deleteNotification: async (id: string) => {
    return apiClient.delete(`/customers/notifications/${id}`);
  },

  getNotificationPreferences: async () => {
    return apiClient.get<NotificationPreferences>('/customers/notifications/preferences');
  },

  updateNotificationPreferences: async (data: Partial<NotificationPreferences>) => {
    return apiClient.put('/customers/notifications/preferences', data);
  },

  // Invoices & Payments
  getMyInvoices: async (params?: { status?: string; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get('/invoices/customer/my-invoices', config);
  },

  getInvoice: async (id: string) => {
    return apiClient.get(`/invoices/${id}`);
  },

  getInvoiceByRequest: async (requestId: string) => {
    return apiClient.get(`/invoices/request/${requestId}`);
  },

  payInvoice: async (id: string, data: { paymentMethod: string; paymentId?: string; transactionId?: string }) => {
    return apiClient.post(`/invoices/${id}/pay`, data);
  },

  // Stripe Payments
  createPaymentIntent: async (invoiceId: string) => {
    return apiClient.post('/payments/create-intent', { invoiceId });
  },

  confirmPayment: async (paymentId: string, paymentIntentId: string) => {
    return apiClient.post('/payments/confirm', { paymentId, paymentIntentId });
  },

  cancelPayment: async (paymentId: string) => {
    return apiClient.post('/payments/cancel', { paymentId });
  },

  getPaymentStatus: async (paymentId: string) => {
    return apiClient.get(`/payments/${paymentId}/status`);
  },
};
