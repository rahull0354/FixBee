import { useQuery } from '@tanstack/react-query';
import { customerApi, adminApi } from '@/lib/api';
import { ProviderProfile } from '@/types';

export function useProviders(filters?: { city?: string; skills?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['providers', filters],
    queryFn: () => customerApi.getProviders(filters),
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => customerApi.getProvider(id),
    enabled: !!id,
  });
}

export function useProviderProfile(id: string) {
  return useQuery({
    queryKey: ['provider-profile', id],
    queryFn: () => adminApi.getProvider(id),
    enabled: !!id,
  });
}
