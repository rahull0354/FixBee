'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import { Session } from '@/types/auth';
import { toast } from 'sonner';
import { TokenManager } from '@/lib/api/client';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const userRole = localStorage.getItem('userRole');
      if (!userRole) {
        throw new Error('No user role found');
      }

      let response;
      switch (userRole) {
        case 'customer':
          response = await authApi.customerGetSessions();
          break;
        case 'provider':
          response = await authApi.providerGetSessions();
          break;
        case 'admin':
          response = await authApi.adminGetSessions();
          break;
        default:
          throw new Error('Invalid user role');
      }

      setSessions(response.sessions || []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch sessions';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const userRole = localStorage.getItem('userRole');
      if (!userRole) {
        throw new Error('No user role found');
      }

      let response;
      switch (userRole) {
        case 'customer':
          response = await authApi.customerRevokeSession(sessionId);
          break;
        case 'provider':
          response = await authApi.providerRevokeSession(sessionId);
          break;
        case 'admin':
          response = await authApi.adminRevokeSession(sessionId);
          break;
        default:
          throw new Error('Invalid user role');
      }

      toast.success('Session revoked successfully');

      // Refresh sessions list
      await getSessions();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to revoke session';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const logoutAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const userRole = localStorage.getItem('userRole');
      if (!userRole) {
        throw new Error('No user role found');
      }

      let response;
      switch (userRole) {
        case 'customer':
          response = await authApi.customerLogoutAll();
          break;
        case 'provider':
          response = await authApi.providerLogoutAll();
          break;
        case 'admin':
          response = await authApi.adminLogoutAll();
          break;
        default:
          throw new Error('Invalid user role');
      }

      toast.success(`Logged out from ${response.count} device(s). Logging out...`);

      // Logout from current device too - clear all auth data
      TokenManager.clearTokens();
      localStorage.removeItem('fixbee_user');
      localStorage.removeItem('userRole');

      // Clear cookies
      if (typeof window !== 'undefined') {
        const cookiesToClear = ['user_role', 'is_suspended'];
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
        });

        // Redirect to home after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to logout from all devices';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    loading,
    error,
    getSessions,
    revokeSession,
    logoutAll,
  };
}
