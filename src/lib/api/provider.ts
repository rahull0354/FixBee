import { apiClient } from './client';
import { ProviderProfile, ServiceRequest, Review, RespondToReviewData } from '@/types';

export const providerApi = {
  // Profile
  getProfile: async (): Promise<ProviderProfile> => {
    return apiClient.get<ProviderProfile>('/providers/profile');
  },

  updateProfile: async (data: Partial<ProviderProfile>) => {
    return apiClient.put('/providers/profile', data);
  },

  toggleAvailability: async (): Promise<{ isAvailable: boolean }> => {
    return apiClient.put('/providers/toggleAvailability');
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
};
