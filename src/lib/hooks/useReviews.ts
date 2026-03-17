import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, providerApi, adminApi } from '@/lib/api';
import { Review, CreateReviewData, UpdateReviewData, RespondToReviewData } from '@/types';
import { toast } from 'sonner';

// Customer hooks
export function useMyReviews() {
  return useQuery({
    queryKey: ['reviews', 'my'],
    queryFn: () => customerApi.getMyReviews(),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: Omit<CreateReviewData, 'requestId'> }) =>
      customerApi.createReview(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewData }) =>
      customerApi.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review');
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    },
  });
}

// Provider hooks
export function useProviderReviews() {
  return useQuery({
    queryKey: ['reviews', 'provider'],
    queryFn: () => providerApi.getMyReviews(),
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: RespondToReviewData }) =>
      providerApi.respondToReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Response added!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add response');
    },
  });
}

// Admin hooks
export function useAllReviews(filters?: { flagged?: boolean; visible?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reviews', 'admin', filters],
    queryFn: () => adminApi.getAllReviews(filters),
  });
}

export function useFlagReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string; hide: boolean } }) =>
      adminApi.flagReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review flagged');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to flag review');
    },
  });
}

export function useUnflagReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.unflagReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review unflagged');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unflag review');
    },
  });
}

export function useToggleReviewVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.toggleReviewVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review visibility updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review visibility');
    },
  });
}
