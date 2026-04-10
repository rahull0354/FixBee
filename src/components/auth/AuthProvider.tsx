'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, UserRole } from '@/types/auth';
import { authApi } from '@/lib/api/auth';
import { TokenManager } from '@/lib/api/client';
import { toast } from 'sonner';
import { useSessionCheck } from '@/lib/hooks/useSessionCheck';

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
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  // Check authentication on mount - runs only once
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check session validity periodically (every 2 minutes)
  // This ensures the user is logged out if their session is revoked from another device
  // Uses the sessions list to verify current session still exists
  useSessionCheck(2 * 60 * 1000, true);

  const checkAuth = () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('fixbee_user');
      const accessToken = TokenManager.getAccessToken();
      const refreshToken = TokenManager.getRefreshToken();

      // Check if we have valid tokens and user data
      if (storedUser && accessToken && refreshToken && !TokenManager.isTokenExpired()) {
        try {
          const user = JSON.parse(storedUser);
          if (user.id !== 'temp') {
            setAuthState({
              user: user,
              accessToken: accessToken,
              refreshToken: refreshToken,
              isAuthenticated: true,
            });

            // Set suspension cookie for providers
            if (user.role === 'provider') {
              const isSuspended = !user.isActive || user.isSuspended;
              if (isSuspended) {
                document.cookie = `is_suspended=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
              } else {
                document.cookie = 'is_suspended=; path=/; max-age=0';
              }
            }
          } else {
            clearAuthData();
          }
        } catch (error) {
          // Invalid data, clear it
          clearAuthData();
        }
      } else {
        // No valid auth data
        clearAuthData();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    TokenManager.clearTokens();
    localStorage.removeItem('fixbee_user');
    localStorage.removeItem('userRole');
    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  };

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      console.log(`Attempting ${role} login for:`, email);

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

      // Handle both OLD and NEW response formats for backwards compatibility
      // OLD format: { token, user/customer/serviceProvider/author }
      // NEW format: { accessToken, refreshToken, expiresIn, customer/serviceProvider/author }

      // Cast to any to access old format properties not in AuthResponse type
      const responseAny = response as any;

      const isNewFormat = responseAny.accessToken && responseAny.refreshToken;
      const isOldFormat = responseAny.token && responseAny.success !== false;

      if (!isNewFormat && !isOldFormat) {
        throw new Error('Invalid response from server - unrecognized format');
      }

      let user, accessToken, refreshToken, expiresIn;

      if (isNewFormat) {
        // NEW FORMAT - check all possible user data keys
        user = responseAny.customer || responseAny.serviceProvider || responseAny.provider || responseAny.author || responseAny.admin ||
               responseAny.user || responseAny.checkCustomer || responseAny.checkServiceProvider || responseAny.checkProvider || responseAny.checkAuthor || responseAny.checkAdmin;
        accessToken = responseAny.accessToken;
        refreshToken = responseAny.refreshToken;
        expiresIn = responseAny.expiresIn;
      } else {
        // OLD FORMAT - backwards compatibility
        user = responseAny.user || responseAny.customer || responseAny.serviceProvider || responseAny.checkCustomer || responseAny.checkServiceProvider || responseAny.checkProvider || responseAny.author || responseAny.checkAuthor || responseAny.checkAdmin;
        accessToken = responseAny.token;
        refreshToken = responseAny.token; // Use same token as refresh for now
        expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
      }

      if (!user) {
        throw new Error('Invalid response from server - missing user data');
      }

      if (!accessToken) {
        throw new Error('Invalid response from server - missing access token');
      }

      // Clear any existing auth data
      clearAuthData();

      // Store tokens using TokenManager (with session ID if provided)
      TokenManager.setTokens(accessToken, refreshToken, expiresIn, response.sessionId);

      // Store user info in localStorage
      localStorage.setItem('fixbee_user', JSON.stringify({ ...user, role }));
      localStorage.setItem('userRole', role);

      // Set user_role cookie for middleware (7 days)
      document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Set is_suspended cookie for providers if user is suspended
      if (role === 'provider' && (user.isSuspended || user.isActive === false)) {
        document.cookie = `is_suspended=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } else {
        document.cookie = 'is_suspended=; path=/; max-age=0';
      }

      // Update auth state
      setAuthState({
        user: { ...user, role },
        accessToken: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: true,
      });

      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);

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

      // Extract user data from response (handle all possible keys)
      const responseAny = response as any;
      const user = responseAny.customer || responseAny.serviceProvider || responseAny.provider ||
                   responseAny.checkCustomer || responseAny.checkServiceProvider || responseAny.checkProvider ||
                   responseAny.user;

      if (typeof window !== 'undefined') {
        // Clear any existing auth data
        clearAuthData();

        // Set user_role cookie to remember registration role
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        localStorage.setItem('userRole', role);
      }

      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      toast.success('Registration successful! Please login to continue.');
    } catch (error: any) {
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
    try {
      const refreshToken = TokenManager.getRefreshToken();
      const userRole = TokenManager.getUserRole();

      // Call backend logout endpoint if we have a refresh token
      if (refreshToken && userRole) {
        try {
          switch (userRole) {
            case 'customer':
              await authApi.customerLogout(refreshToken);
              break;
            case 'provider':
              await authApi.providerLogout(refreshToken);
              break;
            case 'admin':
              await authApi.adminLogout(refreshToken);
              break;
          }
        } catch (error) {
          // Log the error but continue with logout
          console.error('Backend logout failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data regardless of backend logout success
      clearAuthData();

      if (typeof window !== 'undefined') {
        // Clear cookies
        const cookiesToClear = ['user_role', 'is_suspended'];
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
        });

        toast.success('Logged out successfully');

        // Redirect to home
        window.location.href = '/';
      }

      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  };

  const updateUser = (userData: any) => {
    const updatedUser = {
      ...authState.user,
      ...userData,
      role: authState.user?.role || userData.role,
    };

    setAuthState({
      ...authState,
      user: updatedUser,
    });

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
