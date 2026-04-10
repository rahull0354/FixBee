"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Shield, Settings as SettingsIcon, MoveLeft, AlertCircle, XCircle, Clock, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SessionManager } from "@/components/auth/SessionManager";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { customerApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerFormData {
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function CustomerSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  // Deactivate dialog states
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [requestingReactivation, setRequestingReactivation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login/customer");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, router]);

  // Check if account is deactivated and calculate grace period
  const isDeactivated = (user?.isActive === false) || (!!user?.deactivatedAt);
  const daysUntilDeletion = user?.deactivatedAt
    ? 30 - Math.floor((Date.now() - new Date(user.deactivatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleDeactivate = async () => {
    try {
      await customerApi.deactivateAccount();
      toast.success("Account deactivated successfully");
      await logout();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to deactivate account";
      toast.error(message);
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setRequestingReactivation(true);
      await customerApi.requestReactivation(user?.email);
      toast.success("Reactivation link sent to your email. Please check your inbox.");
    } catch (error: any) {
      console.error("Error requesting reactivation:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to request reactivation";
      toast.error(message);
    } finally {
      setRequestingReactivation(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back Link Skeleton */}
        <Skeleton className="h-6 w-40" />

        {/* Gradient Header Skeleton */}
        <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20" />
            <Skeleton className="h-8 sm:h-10 w-48 bg-white/20" />
          </div>
          <Skeleton className="h-4 w-64 bg-white/20" />
        </div>

        {/* Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Danger Zone Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Link */}
      <div
        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold cursor-pointer transition-colors w-fit"
        onClick={() => router.push('/customer/dashboard')}
      >
        <MoveLeft className="h-4 w-4" />
        Back to Dashboard
      </div>

      {/* Header with Gradient Banner */}
      <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Settings</h1>
        </div>
        <p className="text-sky-100 text-sm sm:text-base">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Active Sessions Section */}
      <Card className="border-sky-100 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="p-2 sm:p-3 bg-sky-100 rounded-xl shrink-0">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-sky-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                Active Sessions
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Manage your active sessions across devices
              </p>
            </div>
          </div>
          <SessionManager />
        </CardContent>
      </Card>

      {/* Reactivate Account Section - Only show if deactivated */}
      {isDeactivated && (
        <Card className="border-emerald-100 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
              <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  Reactivate Account
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Request account reactivation
                </p>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-emerald-200 rounded-lg shrink-0">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">Request Reactivation</p>
                  <p className="text-[11px] sm:text-xs text-gray-600">{Math.max(0, daysUntilDeletion)} days remaining</p>
                </div>
              </div>
              <Button
                onClick={handleRequestReactivation}
                disabled={requestingReactivation}
                className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[11px] sm:text-xs"
              >
                {requestingReactivation ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-3 w-3" />
                    Send Reactivation Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone - Deactivate Account */}
      <Card className="border-red-100 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="p-2 sm:p-3 bg-red-100 rounded-xl shrink-0">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-red-800">
                Danger Zone
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Irreversible account actions
              </p>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-linear-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-red-200 rounded-lg shrink-0">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-xs sm:text-sm">Deactivate Account</p>
                <p className="text-[11px] sm:text-xs text-gray-600">Permanently delete all data</p>
              </div>
            </div>
            <Button
              onClick={() => setDeactivateDialogOpen(true)}
              className="w-full bg-white text-red-600 hover:bg-red-50 hover:border-red-300 border-red-200 font-semibold text-xs sm:text-sm"
            >
              Deactivate Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white mx-4">
          {/* Header with Muted Warning Gradient */}
          <div className="bg-linear-to-r from-gray-700 via-slate-700 to-zinc-800 px-4 sm:px-6 py-3 sm:py-4 text-white sticky top-0 z-10">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                Deactivate Account
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-sm sm:text-base">
                This action is permanent and cannot be undone
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 space-y-4">
            {/* Warning Alert */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-slate-200 rounded-xl shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4">
                  <p className="text-base sm:text-lg font-bold text-slate-900">
                    Important Notice
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700">
                    Once deactivated, your account and all data will be permanently deleted after a 30-day grace period.
                  </p>

                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 sm:border-4 border-red-500 w-full shadow-lg">
                    <p className="text-sm sm:text-base font-bold text-red-700 mb-2 sm:mb-3">This action will:</p>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 flex-1">Delete your account and all personal information</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 flex-1">Remove all service request history and data</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 flex-1">Cancel any pending service requests</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 flex-1">Delete all your reviews and ratings</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-gray-800 flex-1">30-day grace period before permanent deletion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info Summary */}
            {user && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                <p className="text-[11px] sm:text-xs text-gray-500 mb-2">Account to be deactivated:</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-[11px] sm:text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 sticky bottom-0 z-10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setDeactivateDialogOpen(false)}
                className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base font-semibold border-2 hover:bg-gray-100"
              >
                Keep Account
              </Button>
              <Button
                onClick={handleDeactivate}
                className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base font-semibold bg-linear-to-r from-slate-600 via-gray-700 to-zinc-800 hover:from-slate-700 hover:via-gray-800 hover:to-zinc-900 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                Deactivate Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
