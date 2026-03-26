'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { customerApi } from '@/lib/api';
import {
  FileText,
  Calendar,
  IndianRupee,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  Wallet,
  CreditCard,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Invoice {
  id: string;
  invoiceNumber: string;
  requestId: string;
  totalAmount: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  paidAt?: string;
  provider?: {
    name: string;
  };
  serviceRequest?: {
    title: string;
    serviceType: string;
  };
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadInvoices();
    }
  }, [authLoading, user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchQuery]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      console.log('=================================');
      console.log('🔄 Loading Invoices for Customer');
      console.log('=================================');

      const response = await customerApi.getMyInvoices();
      console.log('📦 Raw Invoices API Response:', response);

      const apiData = (response as any).data || response;
      console.log('📄 Extracted Invoices Data:', JSON.stringify(apiData, null, 2));

      // Log each invoice's service request details
      if (Array.isArray(apiData)) {
        apiData.forEach((invoice, index) => {
          console.log(`\n📋 Invoice ${index + 1}:`);
          console.log('  - Invoice ID:', invoice.id);
          console.log('  - Invoice Number:', invoice.invoiceNumber);
          console.log('  - Request ID:', invoice.requestId);
          console.log('  - Service Request:', JSON.stringify(invoice.serviceRequest, null, 2));
          console.log('  - Provider:', JSON.stringify(invoice.provider, null, 2));
          console.log('  - Status:', invoice.status);
          console.log('  - Total Amount:', invoice.totalAmount);
        });
      }

      setInvoices(apiData || []);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to load invoices';
      toast.error(message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber?.toLowerCase().includes(query) ||
          invoice.serviceRequest?.title?.toLowerCase().includes(query) ||
          invoice.provider?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section with Back Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Payments & Invoices
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage your service payments and invoices
            </p>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-3 sm:gap-5">
          <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
              Payment Summary
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm font-semibold">
                {invoices.filter(i => i.status === 'paid').length} Paid
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm font-semibold">
                {invoices.filter(i => i.status === 'pending').length} Pending
              </span>
              <span className="font-semibold text-sm sm:text-base">
                Total: ₹{invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-linear-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-sky-100 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />
              </div>
              <Input
                type="text"
                placeholder="Search by invoice number, service title, or provider name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-9 sm:pr-10 h-10 sm:h-12 text-sm border-sky-200 bg-white focus:border-sky-400 focus:ring-sky-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3 sm:w-auto">
              <span className="text-xs sm:text-sm font-semibold text-sky-700">
                Status:
              </span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-40 lg:w-48 border-sky-200 bg-white shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-sky-200 shadow-lg">
                  {statusFilters.map((filter) => (
                    <SelectItem
                      key={filter.value}
                      value={filter.value}
                      className="hover:bg-sky-50 focus:bg-sky-100 cursor-pointer text-sm"
                    >
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-2 sm:space-y-3">
                  {/* Invoice Number & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-sky-600 font-semibold">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">{invoice.invoiceNumber}</span>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>

                  {/* Service Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {invoice.serviceRequest?.title || 'Service'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {invoice.serviceRequest?.serviceType || 'General Service'}
                    </p>
                  </div>

                  {/* Provider & Date */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {invoice.provider && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{invoice.provider.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Amount & Actions */}
                <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-4">
                  {/* Amount */}
                  <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-gray-900">
                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>{parseFloat(invoice.totalAmount).toFixed(2)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/customer/payments/invoices/${invoice.id}`)}
                      className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl text-xs sm:text-sm"
                    >
                      View Invoice
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/customer/payments/checkout/${invoice.id}`)}
                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm"
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
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
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Search and Filter Skeleton */}
      <div className="mb-6">
        <div className="bg-linear-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-sky-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Search Input Skeleton */}
            <Skeleton className="h-10 sm:h-12 w-full flex-1" />

            {/* Status Filter Dropdown Skeleton */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 sm:h-10 w-full sm:w-40 lg:w-48 rounded-lg" />
            </div>
          </div>
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

function EmptyState({
  searchQuery,
  statusFilter,
}: {
  searchQuery: string;
  statusFilter: StatusFilter;
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-sky-100 rounded-full mb-4 sm:mb-6">
        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-sky-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== 'all'
          ? 'No invoices found'
          : 'No payments yet'}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : statusFilter !== 'all'
          ? `You don't have any ${statusFilter} payments`
          : 'Your completed service invoices will appear here once providers complete services'}
      </p>
      {statusFilter !== 'all' && (
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/customer/requests')}
          className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
        >
          View All Requests
        </Button>
      )}
    </div>
  );
}
