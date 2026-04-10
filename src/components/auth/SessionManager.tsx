'use client';

import { useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Globe, X, LogOut, Loader2 } from 'lucide-react';
import { useSessions } from '@/lib/hooks/useSessions';
import { Session } from '@/types/auth';
import { formatDistanceToNow } from 'date-fns';

interface SessionManagerProps {
  userId?: string;
}

export function SessionManager({ userId }: SessionManagerProps) {
  const { sessions, loading, error, getSessions, revokeSession, logoutAll } = useSessions();

  useEffect(() => {
    // Load sessions immediately
    getSessions();
  }, []);

  const getDeviceIcon = (device: string) => {
    const lowerDevice = device.toLowerCase();
    if (lowerDevice.includes('desktop') || lowerDevice.includes('pc')) {
      return <Monitor className="h-5 w-5" />;
    } else if (lowerDevice.includes('android') || lowerDevice.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (lowerDevice.includes('ipad') || lowerDevice.includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Globe className="h-5 w-5" />;
  };

  const getBrowserIcon = (browser: string) => {
    const lowerBrowser = browser.toLowerCase();
    // You can add browser-specific icons here if needed
    return (
      <div className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 rounded">
        {browser.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={getSessions}
          className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your active sessions across different devices
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={logoutAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout All Devices
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
              session.isCurrent
                ? 'bg-violet-50 border-violet-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Device Icon */}
            <div className={`p-3 rounded-lg ${session.isCurrent ? 'bg-violet-100' : 'bg-gray-100'}`}>
              <div className={session.isCurrent ? 'text-violet-600' : 'text-gray-600'}>
                {getDeviceIcon(session.deviceInfo.device)}
              </div>
            </div>

            {/* Session Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {session.deviceInfo.browser}
                    </h4>
                    {session.isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {session.deviceInfo.os} • {session.deviceInfo.device}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    IP: {session.ipAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Revoke Button */}
                {!session.isCurrent && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    Revoke
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No active sessions found</p>
        </div>
      )}
    </div>
  );
}
