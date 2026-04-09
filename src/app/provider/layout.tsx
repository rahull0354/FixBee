'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProviderSidebar } from '@/components/provider/ProviderSidebar';
import { ProviderHeader } from '@/components/provider/ProviderHeader';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle, Mail, Loader2, Lock, Briefcase } from 'lucide-react';
import { providerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { checkProviderProfileComplete } from '@/lib/utils/provider';
import { usePusherNotifications } from '@/lib/hooks/usePusherNotifications';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestingReactivation, setRequestingReactivation] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if account is deactivated and calculate grace period
  const isDeactivated = (user?.isActive === false) || (!!user?.deactivatedAt);
  const daysUntilDeletion = user?.deactivatedAt
    ? 30 - Math.floor((Date.now() - new Date(user.deactivatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check if current page is dashboard or setup page
  const isDashboardPage = pathname === '/provider/dashboard';
  const isSetupPage = pathname === '/provider/profile/setup';

  // Initialize Pusher for real-time notifications (MUST be before conditional returns)
  const pusherNotifications = usePusherNotifications(user?.id, 'provider');

  useEffect(() => {
    checkProfileCompletion();
  }, [pathname]);

  const checkProfileCompletion = async () => {
    // Skip check if on setup page or still loading auth
    if (isSetupPage || loading || !isAuthenticated) {
      setCheckingProfile(false);
      return;
    }

    try {
      setCheckingProfile(true);
      const isComplete = await checkProviderProfileComplete();

      if (!isComplete) {
        toast.info('Please complete your profile setup first');
        router.push('/provider/profile/setup');
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setRequestingReactivation(true);
      await providerApi.requestReactivation(user?.email);
      toast.success('Reactivation link sent to your email. Please check your inbox.');
    } catch (error: any) {
      console.error('Error requesting reactivation:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to request reactivation';
      toast.error(message);
    } finally {
      setRequestingReactivation(false);
    }
  };

  // Show loading state while checking authentication or profile
  if (loading || checkingProfile) {
    return (
      <div className="fixed left-0 top-0 w-screen h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 via-white to-teal-50 z-50">
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
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping" style={{ animationDuration: '2s' }} />
            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full border-4 border-teal-300 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
            {/* Inner ring */}
            <div className="absolute inset-4 rounded-full border-4 border-cyan-300 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.4s' }} />
            {/* Center icon */}
            <div className="absolute inset-4 flex items-center justify-center">
              <div className="w-24 h-24 bg-linear-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl">
                <Briefcase className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading text with animated dots */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Loading FixBee
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-500">Preparing your workspace</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>

          {/* Progress bar with shimmer effect */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto relative">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-50 shimmer" />
            <div className="h-full bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // If no user after logout, show minimal loading - middleware will redirect
  if (!user && !loading) {
    return null;
  }

  return (
    <div className="min-h-screenbg-linear-to-br from-emerald-50 via-white to-teal-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <ProviderSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:ml-72">
        {/* Header */}
        <ProviderHeader
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          pusherUnreadCount={pusherNotifications.unreadCount}
        />

        {/* Deactivated Account Banner */}
        {isDeactivated && !user?.isSuspended && (
          <div className="mx-4 lg:mx-8 mt-4 bg-linear-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-200 rounded-xl shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-1">Account Deactivated</h3>
                  <p className="text-sm text-amber-800 mb-2">
                    Your account is currently deactivated. You have <span className="font-bold">{Math.max(0, daysUntilDeletion)} days</span> remaining to reactivate it before permanent deletion.
                  </p>
                  <p className="text-xs text-amber-700">
                    Please reactivate your account to continue using our services. Click the button below to receive a reactivation link via email.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button
                  onClick={handleRequestReactivation}
                  disabled={requestingReactivation}
                  className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md whitespace-nowrap"
                >
                  {requestingReactivation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reactivate Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {isDeactivated && !isDashboardPage ? (
            // Restricted access message for deactivated users on non-dashboard pages
            <div className="flex items-center justify-center min-h-96">
              <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 border-2 border-amber-200 text-center">
                <div className="w-24 h-24bg-linear-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="h-12 w-12 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-3">Account Deactivated</h1>
                <p className="text-gray-600 mb-6">
                  Your account is currently deactivated. You can only access the dashboard page.
                  Please reactivate your account to continue using all features.
                </p>
                <div className="bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">
                      {Math.max(0, daysUntilDeletion)} days remaining until permanent deletion
                    </p>
                  </div>
                  <p className="text-xs text-amber-700">
                    After this period, your account and all data will be permanently deleted.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    onClick={() => router.push('/provider/dashboard')}
                    className="px-8 py-3 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={handleRequestReactivation}
                    disabled={requestingReactivation}
                    className="px-8 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg"
                  >
                    {requestingReactivation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reactivate Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Normal page content
            children
          )}
        </main>
      </div>
    </div>
  );
}
