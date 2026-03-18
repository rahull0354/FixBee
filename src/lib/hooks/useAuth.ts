import { useAuth as useAuthContext } from '@/components/auth/AuthProvider';
import { UserRole } from '@/types/auth';

export function useAuth() {
  const context = useAuthContext();

  const isCustomer = context.user?.role === 'customer';
  const isProvider = context.user?.role === 'provider';
  const isAdmin = context.user?.role === 'admin';

  return {
    ...context,
    isCustomer,
    isProvider,
    isAdmin,
  };
}

export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();

  if (!auth.loading && !auth.isAuthenticated) {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = `/login${requiredRole ? `/${requiredRole}` : ''}`;
    }
  }

  if (requiredRole && auth.user?.role !== requiredRole) {
    // Redirect if role doesn't match
    if (typeof window !== 'undefined') {
      window.location.href = `/login/${requiredRole}`;
    }
  }

  return auth;
}
