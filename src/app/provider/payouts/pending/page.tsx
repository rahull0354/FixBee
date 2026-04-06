'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import {
  FileText,
  Calendar,
  IndianRupee,
  User,
  Clock,
  CheckCircle,
  Search,
  ArrowLeft,
  Wallet,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  requestId: string;
  totalAmount: number;
  providerEarning: number;
  platformFee: number;
  status: 'pending';
  invoiceDate: string;
  customer?: {
    name: string;
  };
  serviceRequest?: {
    title: string;
    serviceType: string;
  };
}

export default function PendingInvoicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadPendingInvoices();
    }
  }, [authLoading, user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery]);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getPendingInvoices();
      const invoicesData = Array.isArray(response) ? response : [];
      setInvoices(invoicesData);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load pending invoices';
      toast.error(message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber?.toLowerCase().includes(query) ||
          invoice.serviceRequest?.title?.toLowerCase().includes(query) ||
          invoice.customer?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleRequestPayout = async () => {
    if (filteredInvoices.length === 0) {
      toast.error('No pending invoices to payout');
      return;
    }

    try {
      setRequestingPayout(true);
      const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.providerEarning, 0);
      await providerApi.requestPayout(totalAmount);
      toast.success('Payout requested successfully');
      router.push('/provider/payouts');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to request payout';
      toast.error(message);
    } finally {
      setRequestingPayout(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalEarnings = filteredInvoices.reduce((sum, inv) => sum + inv.providerEarning, 0);

  if (loading) {
    return <LoadingSkeleton />;
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Pending Invoices
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Invoices waiting to be included in your next payout
            </p>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm sm:text-base font-medium mb-2">
              Total Pending Earnings ({filteredInvoices.length} invoices)
            </p>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-3xl sm:text-4xl font-bold">{totalEarnings.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <Wallet className="h-8 w-8 sm:h-12 sm:w-12" />
            </div>
            {filteredInvoices.length > 0 && (
              <Button
                onClick={handleRequestPayout}
                disabled={requestingPayout}
                className="bg-white text-emerald-600 hover:bg-white/90 font-semibold"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Request Payout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-100 shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 relative w-full">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <Input
                type="text"
                placeholder="Search by invoice number, service title, or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-9 sm:pr-10 h-10 sm:h-12 text-sm border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-400 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 sm:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-2 sm:space-y-3">
                  {/* Invoice Number & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">{invoice.invoiceNumber}</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>

                  {/* Service Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {invoice.serviceRequest?.title || 'Service Request'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {invoice.serviceRequest?.serviceType || 'General Service'}
                    </p>
                  </div>

                  {/* Customer & Date */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {invoice.customer && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{invoice.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Amount */}
                <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-4">
                  {/* Amount Breakdown */}
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-1 text-sm sm:text-base font-bold text-gray-900">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{invoice.providerEarning.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Your Earnings</p>
                    {invoice.totalAmount > 0 && (
                      <p className="text-xs text-gray-400 line-through">
                        Total: ₹{invoice.totalAmount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* View Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/provider/payments/${invoice.id}`)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} />
      )}
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

      {/* Search Skeleton */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-100">
          <Skeleton className="h-10 sm:h-12 w-full" />
        </div>
      </div>

      {/* Invoice Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full mb-4 sm:mb-6">
        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery ? 'No invoices found' : 'No pending invoices'}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'You don\'t have any pending invoices waiting for payout'}
      </p>
    </div>
  );
}
