'use client';

import { useEffect, useRef } from 'react';
import { TokenManager } from '@/lib/api/client';
import { toast } from 'sonner';
import { Session } from '@/types/auth';

/**
 * Hook to periodically check if the current session is still valid
 * by verifying it exists in the sessions list.
 *
 * NOTE: With the new backend implementation, sessions are immediately
 * revoked via refresh token validation. This hook serves as
 * a secondary check to verify session status.
 *
 * @param checkInterval - Interval in milliseconds (default: 5 minutes)
 * @param enabled - Whether to enable session checking (default: true)
 * @param initialDelay - Initial delay before first check in milliseconds (default: 30 seconds)
 */
export function useSessionCheck(
  checkInterval: number = 5 * 60 * 1000,
  enabled: boolean = true,
  initialDelay: number = 30 * 1000
) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if user is authenticated
    const accessToken = TokenManager.getAccessToken();
    if (!accessToken) return;

    const checkSession = async () => {
      // Prevent multiple concurrent checks
      if (isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const { authApi } = await import('@/lib/api/auth');
        const userRole = TokenManager.getUserRole();

        if (!userRole) {
          return;
        }

        // Get sessions list (backend now filters out revoked sessions)
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
            return;
        }

        const sessions: Session[] = response.sessions || [];

        // First time: find and store the current session
        if (!currentSessionIdRef.current && sessions.length > 0) {
          const currentSession = sessions.find(s => s.isCurrent);

          if (currentSession) {
            currentSessionIdRef.current = currentSession.id;
            initializedRef.current = true;
          }
          return;
        }

        // Subsequent checks: verify our stored session still exists
        if (currentSessionIdRef.current && initializedRef.current) {
          const sessionExists = sessions.some(s => s.id === currentSessionIdRef.current);

          if (!sessionExists) {
            // Session was revoked
            await performLogout();
          }
        }
      } catch (error: any) {
        // If we get a 401, the axios interceptor has already handled it
        if (error?.response?.status === 401 && !error?.handled) {
          await performLogout();
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    const performLogout = async () => {
      // Clear all auth data
      TokenManager.clearTokens();
      localStorage.removeItem('fixbee_user');
      localStorage.removeItem('userRole');
      currentSessionIdRef.current = null;

      // Clear cookies
      if (typeof window !== 'undefined') {
        const cookiesToClear = ['user_role', 'is_suspended'];
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
        });

        toast.error('Your session has been revoked. Please login again.');

        // Redirect to login
        window.location.href = '/login?reason=session_revoked';
      }
    };

    // Wait before first check
    initialTimeoutRef.current = setTimeout(() => {
      checkSession();

      // Set up periodic checks (backup to immediate revocation)
      checkIntervalRef.current = setInterval(checkSession, checkInterval);
    }, initialDelay);

    // Cleanup on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
      }
    };
  }, [checkInterval, enabled, initialDelay]);
}
