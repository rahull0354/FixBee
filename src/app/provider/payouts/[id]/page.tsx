'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  IndianRupee,
  FileText,
  Building,
  User,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PayoutDetails {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  utr?: string;
  notes?: string;
  failureReason?: string;
  provider?: {
    id: string;
    name: string;
    email: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
  }>;
  payoutGroupId?: string;
  providerId?: string;
  processedBy?: string;
  invoiceIds?: string[];
}

export default function PayoutDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const payoutId = params.id as string;

  const [payout, setPayout] = useState<PayoutDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && payoutId) {
      loadPayoutDetails();
    }
  }, [authLoading, user, payoutId]);

  const loadPayoutDetails = async () => {
    try {
      setLoading(true);
      const data = await providerApi.getPayoutById(payoutId) as any;

      console.log('Raw payout details response:', data);

      // Handle the actual API response structure
      const sanitizedPayout: PayoutDetails = {
        id: data?.id || '',
        amount: typeof data?.totalAmount === 'string' ? parseFloat(data.totalAmount) : (data?.totalAmount || 0),
        status: data?.status || 'pending',
        requestedAt: data?.initiatedAt || data?.requestedAt || data?.createdAt || new Date().toISOString(),
        processedAt: data?.processedAt || data?.updatedAt,
        transactionId: data?.transactionId,
        utr: data?.utr,
        notes: data?.notes,
        failureReason: data?.failureReason,
        provider: data?.provider,
        bankAccount: data?.bankAccount,
        invoices: data?.invoiceIds?.map((id: string, index: number) => ({
          id,
          invoiceNumber: `INV-${String(index + 1).padStart(3, '0')}`,
          amount: 0, // Backend doesn't provide individual invoice amounts
        })) || [],
        // Add additional metadata
        payoutGroupId: data?.payoutGroupId,
        providerId: data?.providerId,
        processedBy: data?.processedBy,
        invoiceIds: data?.invoiceIds || [],
      };

      console.log('Sanitized payout details:', sanitizedPayout);
      setPayout(sanitizedPayout);
    } catch (error: any) {
      console.error('Error loading payout details:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to load payout details';
      toast.error(message);
      router.push('/provider/payouts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Calendar className="h-4 w-4 mr-1" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="h-4 w-4 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!payout) {
    return (
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center py-12 sm:py-16">
          <Wallet className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Payout not found
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            The payout you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push('/provider/payouts')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Back to Payouts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/provider/payouts"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payouts
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Payout Details
              </h1>
              {getStatusBadge(payout?.status || 'pending')}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {payout?.payoutGroupId || `Payout #${payout?.id ? payout.id.slice(-6) : 'Unknown'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Amount Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm sm:text-base font-medium mb-2">Payout Amount</p>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-3xl sm:text-4xl font-bold">{(payout?.amount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
            <Wallet className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Status Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600">Current Status</span>
                {getStatusBadge(payout?.status || 'pending')}
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600">Requested On</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {formatDate(payout?.requestedAt || '')}
                </span>
              </div>
              {payout?.processedAt && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm sm:text-base text-gray-600">Processed On</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatDate(payout.processedAt!)}
                  </span>
                </div>
              )}
              {(payout?.transactionId || payout?.utr) && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm sm:text-base text-gray-600">
                    {payout?.transactionId && payout?.utr && payout.transactionId === payout.utr
                      ? 'Transaction ID / UTR'
                      : payout?.transactionId
                      ? 'Transaction ID'
                      : 'UTR'}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {payout.transactionId || payout.utr}
                  </span>
                </div>
              )}
              {payout?.transactionId && payout?.utr && payout.transactionId !== payout.utr && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm sm:text-base text-gray-600">UTR</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {payout.utr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Failure Information */}
          {payout?.status === 'failed' && payout?.failureReason && (
            <div className="bg-red-50 rounded-2xl shadow-lg border border-red-200 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-4">Failure Information</h2>
              <p className="text-sm sm:text-base text-red-700">{payout.failureReason!}</p>
              {payout?.notes && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-xs sm:text-sm text-red-600">Additional Notes</p>
                  <p className="text-sm sm:text-base text-red-800 mt-1">{payout.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {payout?.notes && payout?.status !== 'failed' && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm sm:text-base text-gray-700">{payout.notes}</p>
            </div>
          )}

          {/* Included Invoices */}
          {payout?.invoices && payout.invoices.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Included Invoices ({payout.invoices.length})
              </h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Total Amount:</span> ₹{(payout.amount || 0).toFixed(2)} across {payout.invoices.length} invoice{payout.invoices.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-3">
                {payout.invoices.map((invoice, index) => (
                  <Link
                    key={invoice.id}
                    href={`/provider/payments/${invoice.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-gray-600">Invoice ID: {invoice.id.slice(-8)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        </div>
                        <div className="text-emerald-600 group-hover:text-emerald-700 transition-colors">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Bank Account */}
        <div className="space-y-6">
          {/* Additional Payout Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Payout Information
              </div>
            </h2>
            <div className="space-y-3">
              {payout?.payoutGroupId && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-600">Payout Group ID</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{payout.payoutGroupId}</span>
                </div>
              )}
              {payout?.invoiceIds && payout.invoiceIds.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-600">Number of Invoices</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{payout.invoiceIds.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs sm:text-sm text-gray-600">Payout ID</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{payout?.id?.slice(-8) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Bank Account Information */}
          {payout?.bankAccount && Object.keys(payout.bankAccount).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600" />
                  Bank Account
                </div>
              </h2>
              <div className="space-y-4">
                {payout.bankAccount?.bankName && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Bank Name</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {payout.bankAccount.bankName}
                    </p>
                  </div>
                )}
                {payout.bankAccount?.accountNumber && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Account Number</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {payout.bankAccount.accountNumber}
                    </p>
                  </div>
                )}
                {payout.bankAccount?.ifsc && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">IFSC Code</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {payout.bankAccount.ifsc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Provider Information */}
          {payout?.provider && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Provider Information
                </div>
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Name</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {payout.provider!.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {payout.provider!.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link href="/provider/payments" className="block">
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Invoices
                </Button>
              </Link>
              <Link href="/provider/dashboard" className="block">
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 justify-start"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      {/* Back Button Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-6 w-32 mb-3" />
      </div>

      {/* Header Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Banner Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
