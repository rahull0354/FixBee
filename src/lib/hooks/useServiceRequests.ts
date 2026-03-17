import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, providerApi } from '@/lib/api';
import { ServiceRequest, CreateServiceRequestData, UpdateServiceRequestData } from '@/types';
import { toast } from 'sonner';

export function useMyServiceRequests(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['service-requests', 'my', filters],
    queryFn: () => customerApi.getMyServiceRequests(filters),
  });
}

export function useServiceRequest(id: string) {
  return useQuery({
    queryKey: ['service-request', id],
    queryFn: () => customerApi.getServiceRequest(id),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequestData) => customerApi.createServiceRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Service request created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create service request');
    },
  });
}

export function useCancelServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      customerApi.cancelServiceRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Service request cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel service request');
    },
  });
}

export function useRescheduleServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequestData }) =>
      customerApi.rescheduleServiceRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Service request rescheduled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule service request');
    },
  });
}

export function useAvailableRequests(filters?: { city?: string; skills?: string; date?: string }) {
  return useQuery({
    queryKey: ['service-requests', 'available', filters],
    queryFn: () => providerApi.getAvailableRequests(filters),
  });
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => providerApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Request accepted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    },
  });
}

export function useMyAssignments(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['service-requests', 'assigned', filters],
    queryFn: () => providerApi.getMyAssignedRequests(filters),
  });
}

export function useStartService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => providerApi.startService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Service started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start service');
    },
  });
}

export function useCompleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { afterImages?: string[]; finalPrice?: number } }) =>
      providerApi.completeService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Service completed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete service');
    },
  });
}
