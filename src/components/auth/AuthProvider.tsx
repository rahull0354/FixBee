'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, UserRole } from '@/types/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: any, role: 'customer' | 'provider') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
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

  // Check authentication on mount - runs only once
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = () => {
    try {
      // Check localStorage for stored user data
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('fixbee_user');

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Only set authenticated if we have actual user data (not temp user)
          if (user.id !== 'temp') {
            setAuthState({
              user: user,
              token: null,
              isAuthenticated: true,
            });
          } else {
            // Clear temp user from localStorage
            localStorage.removeItem('fixbee_user');
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          // Invalid data in localStorage, clear it
          localStorage.removeItem('fixbee_user');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      }
      // Note: user_role cookie is only used to remember which role to pre-fill on login page
      // It does NOT authenticate the user
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
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

      // Extract user data from response
      const responseObj = response as any;
      const user = responseObj.user || responseObj.checkCustomer || responseObj.checkServiceProvider || responseObj.checkProvider || responseObj.author || responseObj.checkAuthor || responseObj;
      const token = responseObj.token;

      // Clear any existing auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fixbee_user');
        document.cookie = 'user_role=; path=/; max-age=0';
      }

      // Store authentication data
      if (typeof window !== 'undefined') {
        // Set auth_token cookie for backend authentication (7 days)
        if (token) {
          document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }

        // Set user_role cookie for middleware (7 days)
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        // Store user info in localStorage
        localStorage.setItem('fixbee_user', JSON.stringify({ ...user, role }));
      }

      // Update auth state
      setAuthState({
        user: { ...user, role },
        token: token || null,
        isAuthenticated: true,
      });

      toast.success('Login successful!');
    } catch (error: any) {
      // Extract error message
      let message = 'Login failed';

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.error) {
        message = error.response.data.error;
      } else if (error?.message) {
        message = error.message;
      }

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

      // Extract user data from response
      const responseObj = response as any;
      const user = responseObj.user || responseObj.customer || responseObj.checkCustomer || responseObj.serviceProvider || responseObj.checkServiceProvider || responseObj.provider || responseObj.checkProvider || responseObj;
      const token = responseObj.token;

      if (typeof window !== 'undefined') {
        // Clear any existing auth data
        localStorage.removeItem('fixbee_user');
        document.cookie = 'auth_token=; path=/; max-age=0';
        document.cookie = 'user_role=; path=/; max-age=0';

        // Set user_role cookie to remember registration role
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      });

      toast.success('Registration successful! Please login to continue.');
    } catch (error: any) {
      // Extract error message
      let message = 'Registration failed';

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.error) {
        message = error.response.data.error;
      } else if (error?.message) {
        message = error.message;
      }

      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    // Clear all auth data
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('fixbee_user');

      // Clear cookies with proper settings
      const cookiesToClear = ['auth_token', 'user_role'];
      cookiesToClear.forEach(cookieName => {
        // Clear cookie for root path
        document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
        // Also try clearing with domain
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
      });

      // Clear cookies immediately and redirect BEFORE updating state
      toast.success('Logged out successfully');

      // Use href instead of replace to ensure immediate navigation
      window.location.href = '/';
    }

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  const updateUser = (userData: any) => {
    // Merge with existing user data, preserving the role
    const updatedUser = {
      ...authState.user,
      ...userData,
      role: authState.user?.role || userData.role,
    };

    setAuthState({
      ...authState,
      user: updatedUser,
    });

    // Update localStorage with new user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('fixbee_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, updateUser, loading }}>
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
