'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, UserRole } from '@/types/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: any, role: 'customer' | 'provider') => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get user info from all possible role endpoints
      const roles: UserRole[] = ['customer', 'provider', 'admin'];

      for (const role of roles) {
        try {
          const response: any = await authApi.verifyToken(role);
          if (response?.data?.user) {
            setAuthState({
              user: response.data.user,
              token: response.data.token || null,
              isAuthenticated: true,
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          // Continue to next role
          continue;
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      let response;

      switch (role) {
        case 'customer':
          response = await authApi.customerLogin({ email, password });
          break;
        case 'provider':
          response = await authApi.providerLogin({ email, password });
          break;
        case 'admin':
          response = await authApi.adminLogin({ email, password });
          break;
        default:
          throw new Error('Invalid role');
      }

      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });

      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: any, role: 'customer' | 'provider') => {
    try {
      let response;

      if (role === 'customer') {
        response = await authApi.customerRegister(data);
      } else {
        response = await authApi.providerRegister(data);
      }

      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });

      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const role = authState.user?.role;
      if (role) {
        switch (role) {
          case 'customer':
            await authApi.customerLogout();
            break;
          case 'provider':
            await authApi.providerLogout();
            break;
          case 'admin':
            await authApi.adminLogout();
            break;
        }
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
