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
    return apiClient.get<ServiceRequest>(`/serviceRequest/provider/service-request/${id}`);
  },

  getCustomerById: async (customerId: string) => {
    return apiClient.get(`/customers/${customerId}`);
  },

  startService: async (id: string): Promise<ServiceRequest> => {
    return apiClient.patch<ServiceRequest>(`/request/start/${id}`);
  },

  completeService: async (id: string, data: {
    afterImages?: string[];
    finalPrice?: number;
    materialCost?: number;
    materialDescription?: string;
  }): Promise<ServiceRequest> => {
    return apiClient.patch<ServiceRequest>(`/request/complete/${id}`, data);
  },

  // Reviews
  getMyReviews: async (): Promise<Review[]> => {
    return apiClient.get<Review[]>('/review/provider/my-reviews');
  },

  getReviewById: async (reviewId: string): Promise<Review> => {
    return apiClient.get<Review>(`/review/general/${reviewId}`);
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

  // Payments & Earnings
  getMyPayments: async (): Promise<Array<{
    id: string;
    invoiceNumber: string;
    requestId: string;
    totalAmount: string;
    providerEarning: string;
    platformFee: string;
    status: 'pending' | 'paid' | 'processing' | 'failed';
    invoiceDate: string;
    paidAt?: string;
    customer?: {
      name: string;
    };
    serviceRequest?: {
      title: string;
      serviceType: string;
    };
  }>> => {
    return apiClient.get('/invoices/provider/my-invoices');
  },

  getMyEarnings: async (): Promise<Array<{
    id: string;
    invoiceNumber: string;
    requestId: string;
    totalAmount: string;
    providerEarning: string;
    platformFee: string;
    status: 'pending' | 'paid' | 'processing' | 'failed';
    invoiceDate: string;
    paidAt?: string;
    customer?: {
      name: string;
    };
    serviceRequest?: {
      title: string;
      serviceType: string;
    };
  }>> => {
    return apiClient.get('/invoices/provider/my-invoices');
  },

  getPaymentById: async (paymentId: string): Promise<any> => {
    return apiClient.get(`/invoices/${paymentId}`);
  },

  getPayoutHistory: async (): Promise<Array<{
    id: string;
    amount: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    transactionId?: string;
  }>> => {
    return apiClient.get('/invoices/provider/payouts');
  },

  requestPayout: async (amount: number) => {
    return apiClient.post('/invoices/provider/payouts/request', { amount });
  },

  // Payouts
  getPayouts: async (params?: { status?: string; page?: number; limit?: number }): Promise<Array<{
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: string;
    processedAt?: string;
    transactionId?: string;
    utr?: string;
    notes?: string;
    failureReason?: string;
  }>> => {
    const config = params ? { params } : undefined;
    return apiClient.get('/providers/payouts', config) as any;
  },

  getPayoutSummary: async (): Promise<{
    totalEarnings: number;
    pendingAmount: number;
    paidAmount: number;
    processingAmount: number;
    failedAmount: number;
    totalPayouts: number;
    pendingPayouts: number;
    completedPayouts: number;
  }> => {
    return apiClient.get('/providers/payouts/summary') as any;
  },

  getPendingInvoices: async (params?: { page?: number; limit?: number }): Promise<Array<{
    id: string;
    invoiceNumber: string;
    requestId: string;
    totalAmount: number;
    providerEarning: number;
    platformFee: number;
    status: 'pending';
    invoiceDate: string;
    customer?: {
      name: string;
    };
    serviceRequest?: {
      title: string;
      serviceType: string;
    };
  }>> => {
    const config = params ? { params } : undefined;
    return apiClient.get('/providers/payouts/pending', config);
  },

  getPayoutById: async (payoutId: string): Promise<{
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: string;
    processedAt?: string;
    transactionId?: string;
    utr?: string;
    notes?: string;
    failureReason?: string;
    provider?: {
      id: string;
      name: string;
      email: string;
    };
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      ifsc: string;
    };
    invoices?: Array<{
      id: string;
      invoiceNumber: string;
      amount: number;
    }>;
  }> => {
    return apiClient.get(`/providers/payouts/${payoutId}`);
  },

  // Bank Accounts
  getBankAccounts: async () => {
    return apiClient.get('/providers/bank-accounts');
  },

  getPrimaryBankAccount: async () => {
    return apiClient.get('/providers/bank-accounts/primary');
  },

  getBankAccountById: async (bankAccountId: string) => {
    return apiClient.get(`/providers/bank-accounts/${bankAccountId}`);
  },

  addBankAccount: async (data: {
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    bankName: string;
    accountType?: string;
  }) => {
    return apiClient.post('/providers/bank-accounts', data);
  },

  updateBankAccount: async (bankAccountId: string, data: {
    accountNumber?: string;
    ifsc?: string;
    accountHolder?: string;
    bankName?: string;
    accountType?: string;
  }) => {
    return apiClient.put(`/providers/bank-accounts/${bankAccountId}`, data);
  },

  deleteBankAccount: async (bankAccountId: string) => {
    return apiClient.delete(`/providers/bank-accounts/${bankAccountId}`);
  },

  setPrimaryBankAccount: async (bankAccountId: string) => {
    return apiClient.patch(`/providers/bank-accounts/${bankAccountId}/set-primary`);
  },

  // UPI ID methods (UPI IDs are managed within bank accounts)
  addUpiId: async (data: {
    upiId: string;
  }) => {
    return apiClient.post('/providers/bank-accounts', {
      ...data,
      accountType: 'upi',
    });
  },

  updateUpiId: async (bankAccountId: string, data: {
    upiId: string;
  }) => {
    return apiClient.put(`/providers/bank-accounts/${bankAccountId}`, {
      upiId: data.upiId,
    });
  },

  deleteUpiId: async (bankAccountId: string) => {
    return apiClient.delete(`/providers/bank-accounts/${bankAccountId}`);
  },
};
