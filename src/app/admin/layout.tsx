'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted) {
      if (!isAuthenticated) {
        router.push('/login/admin');
        return;
      }
      // Check if user is admin
      if (user && user.role !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, mounted, router]);

  // Show loading state while checking authentication
  if (authLoading || !mounted) {
    return (
      <div className="fixed left-0 top-0 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 z-50">
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
        <div className="text-center space-y-8">
          {/* Animated Logo */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" style={{ animationDuration: '2s' }} />
            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full border-4 border-blue-300 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
            {/* Inner ring */}
            <div className="absolute inset-4 rounded-full border-4 border-cyan-300 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.4s' }} />
            {/* Center icon */}
            <div className="absolute inset-4 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl">
                <Shield className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading text with animated dots */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
              Loading FixBee
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-500">Preparing your workspace</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>

          {/* Progress bar with shimmer effect */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 shimmer" />
            <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // If no user after logout, show minimal loading - middleware will redirect
  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:ml-72">
        {/* Header */}
        <AdminHeader user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
