'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { customerApi } from '@/lib/api';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function ReactivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid reactivation link. Please request a new reactivation link.');
      return;
    }

    verifyReactivation();
  }, [token]);

  const verifyReactivation = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid reactivation link. Please request a new reactivation link.');
      return;
    }

    try {
      const response = await customerApi.verifyReactivation(token);
      setStatus('success');
      setMessage('Your account has been successfully reactivated! You can now log in.');
      toast.success('Account reactivated successfully');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login/customer');
      }, 3000);
    } catch (error: any) {
      console.error('Reactivation error:', error);
      setStatus('error');
      setMessage(
        error?.response?.data?.message ||
        'Invalid or expired reactivation link. Please request a new one.'
      );
      toast.error('Reactivation failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-sky-100">
          {status === 'loading' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Reactivating Your Account</h1>
                <p className="text-gray-600">Please wait while we verify your reactivation link...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Reactivated!</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to login page...</p>
              </div>
              <Button
                onClick={() => router.push('/auth/login/customer')}
                className="w-full bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Reactivation Failed</h1>
                <p className="text-gray-600 mb-6">{message}</p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/login/customer')}
                  className="w-full bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/customer/profile')}
                  variant="outline"
                  className="w-full border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  Request New Reactivation Link
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-200 rounded-lg shrink-0">
              <Mail className="h-4 w-4 text-blue-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Grace Period</p>
              <p className="text-xs text-blue-800">
                You can reactivate your account within 30 days of deactivation. After 30 days, your account will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
