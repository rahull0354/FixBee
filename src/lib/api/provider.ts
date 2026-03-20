import { apiClient } from './client';
import { ProviderProfile, ServiceRequest, Review, RespondToReviewData } from '@/types';

export const providerApi = {
  // Dashboard
  getDashboardStats: async (): Promise<{
    totalAssignments: number;
    completedServices: number;
    inProgressServices: number;
    assignedServices: number;
    totalEarnings: number;
    averageRating: number;
    ratingDistribution: any[];
    isAvailable: boolean;
  }> => {
    return apiClient.get('/providers/dashboard');
  },

  getMonthlyEarnings: async (months: number = 6): Promise<Array<{ month: string; earnings: number }>> => {
    return apiClient.get(`/providers/dashboard/monthly-earnings?months=${months}`);
  },

  getMonthlyPerformance: async (months: number = 6): Promise<Array<{ month: string; completed: number; earnings: number }>> => {
    return apiClient.get(`/providers/dashboard/monthly-performance?months=${months}`);
  },

  // Profile
  getProfile: async (): Promise<ProviderProfile> => {
    return apiClient.get<ProviderProfile>('/providers/profile');
  },

  updateProfile: async (data: Partial<ProviderProfile>) => {
    return apiClient.put('/providers/profile', data);
  },

  toggleAvailability: async (status: 'available' | 'busy' | 'offline'): Promise<{ isAvailable: boolean }> => {
    return apiClient.put('/providers/toggleAvailability', { status });
  },

  deactivateAccount: async () => {
    return apiClient.post('/providers/deactivate-account');
  },

  requestReactivation: async (email?: string) => {
    return apiClient.post('/providers/request-reactivation', { email });
  },

  verifyReactivation: async (token: string) => {
    return apiClient.get(`/providers/reactivate-account/${token}`);
  },

  // Service Requests
  getAvailableRequests: async (params?: { city?: string; skills?: string; date?: string }) => {
    const config = params ? { params } : undefined;
    return apiClient.get<ServiceRequest[]>('/request/available-requests', config);
  },

  acceptRequest: async (requestId: string): Promise<ServiceRequest> => {
    return apiClient.post<ServiceRequest>(`/request/accept/${requestId}`);
  },

  getMyAssignedRequests: async (params?: { status?: string; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get<ServiceRequest[]>('/request/my-assigned-requests', config);
  },

  getRequestDetails: async (id: string): Promise<ServiceRequest> => {
    return apiClient.get<ServiceRequest>(`/request/provider/service-request/${id}`);
  },

  getCustomerById: async (customerId: string) => {
    return apiClient.get(`/customers/${customerId}`);
  },

  startService: async (id: string): Promise<ServiceRequest> => {
    return apiClient.patch<ServiceRequest>(`/request/start/${id}`);
  },

  completeService: async (id: string, data: { afterImages?: string[]; finalPrice?: number }): Promise<ServiceRequest> => {
    return apiClient.patch<ServiceRequest>(`/request/complete/${id}`, data);
  },

  // Reviews
  getMyReviews: async (): Promise<Review[]> => {
    return apiClient.get<Review[]>('/review/provider/my-reviews');
  },

  respondToReview: async (reviewId: string, data: RespondToReviewData): Promise<Review> => {
    return apiClient.patch<Review>(`/review/provider/respond/${reviewId}`, data);
  },

  // Notifications
  getNotifications: async (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const config = params ? { params } : undefined;
    return apiClient.get<{ notifications: any[]; total: number; unreadCount: number }>('/providers/notifications', config);
  },

  markNotificationAsRead: async (id: string) => {
    return apiClient.patch(`/providers/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: async () => {
    return apiClient.patch('/providers/notifications/read-all');
  },

  deleteNotification: async (id: string) => {
    return apiClient.delete(`/providers/notifications/${id}`);
  },
};
