"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { providerApi } from "@/lib/api";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronRight,
  ArrowLeft,
  Calendar,
  IndianRupee,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payout {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  utr?: string;
  notes?: string;
  failureReason?: string;
}

interface PayoutSummary {
  totalEarnings: number;
  pendingAmount: number;
  paidAmount: number;
  processingAmount: number;
  failedAmount: number;
  totalPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
}

type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Payouts" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

export default function ProviderPayoutsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary>({
    totalEarnings: 0,
    pendingAmount: 0,
    paidAmount: 0,
    processingAmount: 0,
    failedAmount: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
  });
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadPayouts();
      loadSummary();
    }
  }, [authLoading, user]);

  useEffect(() => {
    filterPayouts();
  }, [payouts, statusFilter, searchQuery]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getPayouts() as any;

      // Handle the actual API response structure
      let payoutsData = [];

      if (Array.isArray(response)) {
        payoutsData = response;
      } else if (response?.recentPayouts && Array.isArray(response.recentPayouts)) {
        payoutsData = response.recentPayouts;
      } else if (response?.payouts && Array.isArray(response.payouts)) {
        payoutsData = response.payouts;
      } else if (typeof response === 'object' && response !== null) {
        // Try to find an array in the response
        const possibleArray = Object.values(response).find(val => Array.isArray(val));
        if (possibleArray) {
          payoutsData = possibleArray;
        }
      }

      // Ensure all payouts have required fields with defaults
      const sanitizedPayouts = payoutsData.map((payout: any) => ({
        id: payout.id || payout._id || '',
        amount: typeof payout.totalAmount === 'string' ? parseFloat(payout.totalAmount) : (payout.totalAmount || 0),
        status: payout.status || 'pending',
        requestedAt: payout.initiatedAt || payout.requestedAt || payout.createdAt || new Date().toISOString(),
        processedAt: payout.processedAt || payout.updatedAt,
        transactionId: payout.transactionId,
        utr: payout.utr,
        notes: payout.notes,
        failureReason: payout.failureReason,
      }));

      setPayouts(sanitizedPayouts);
    } catch (error: any) {
      console.error('Error loading payouts:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load payouts";
      toast.error(message);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryResponse = await providerApi.getPayoutSummary() as any;

      // Handle the actual API response structure
      const summaryData = summaryResponse;

      const sanitizedSummary = {
        totalEarnings: Number(summaryData?.totalPaid || 0) + Number(summaryData?.totalPending || 0) + Number(summaryData?.totalProcessing || 0),
        pendingAmount: Number(summaryData?.totalPending || 0),
        paidAmount: Number(summaryData?.totalPaid || 0),
        processingAmount: Number(summaryData?.totalProcessing || 0),
        failedAmount: 0, // Backend doesn't provide this field
        totalPayouts: Number(summaryData?.totalPaidCount || 0) + Number(summaryData?.totalPendingCount || 0),
        pendingPayouts: Number(summaryData?.totalPendingCount || 0),
        completedPayouts: Number(summaryData?.totalPaidCount || 0),
      };

      setSummary(sanitizedSummary);
    } catch (error: any) {
      console.error("Error loading payout summary:", error);
      // Set default values on error
      setSummary({
        totalEarnings: 0,
        pendingAmount: 0,
        paidAmount: 0,
        processingAmount: 0,
        failedAmount: 0,
        totalPayouts: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
      });
    }
  };

  const filterPayouts = () => {
    let filtered = [...payouts];

    if (statusFilter !== "all") {
      filtered = filtered.filter((payout) => payout.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payout) =>
          payout.id?.toLowerCase().includes(query) ||
          payout.transactionId?.toLowerCase().includes(query) ||
          payout.utr?.toLowerCase().includes(query),
      );
    }

    setFilteredPayouts(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
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
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Payouts
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View your payout history and summary
            </p>
          </div>
          <Link href="/provider/payouts/pending">
            <Button className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base">
              <Clock className="h-4 w-4 mr-2" />
              View Pending Payouts
            </Button>
          </Link>
        </div>
      </div>

      {/* Banner Section - Payout Summary */}
      <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-3 sm:gap-5">
          <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
              Payout Summary
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm font-semibold">
                {summary.completedPayouts} Completed
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm font-semibold">
                {summary.pendingPayouts} Pending
              </span>
              <span className="font-semibold text-sm sm:text-base">
                Total: ₹{(summary.paidAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Earnings */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">
            Total Earnings
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ₹{(summary.totalEarnings || 0).toFixed(2)}
          </p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Paid Amount</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ₹{(summary.paidAmount || 0).toFixed(2)}
          </p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-amber-100 rounded-xl">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">
            Pending Amount
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ₹{(summary.pendingAmount || 0).toFixed(2)}
          </p>
        </div>

        {/* Processing Amount */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">
            Processing Amount
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ₹{(summary.processingAmount || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-100 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <Input
                type="text"
                placeholder="Search by payout ID, transaction ID, or UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-9 sm:pr-10 h-10 sm:h-12 text-sm border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-400 shadow-sm"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3 sm:w-auto">
              <span className="text-xs sm:text-sm font-semibold text-emerald-700">
                Status:
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger className="w-full sm:w-40 lg:w-48 border-emerald-200 bg-white shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 shadow-lg">
                  {statusFilters.map((filter) => (
                    <SelectItem
                      key={filter.value}
                      value={filter.value}
                      className="hover:bg-emerald-50 focus:bg-emerald-100 cursor-pointer text-sm"
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

      {/* Payouts List */}
      {filteredPayouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredPayouts.map((payout) => (
            <div
              key={payout.id}
              className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/provider/payouts/${payout.id}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-2 sm:space-y-3">
                  {/* Payout ID & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">
                        Payout #{payout.id ? payout.id.slice(-6) : 'Unknown'}
                      </span>
                    </div>
                    {getStatusBadge(payout.status || 'pending')}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {payout.transactionId && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>TXN: {payout.transactionId}</span>
                      </div>
                    )}
                    {payout.utr && (
                      <div className="flex items-center gap-1">
                        <span>UTR: {payout.utr}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Requested: {formatDate(payout.requestedAt || new Date().toISOString())}</span>
                    </div>
                    {payout.processedAt && (
                      <div className="flex items-center gap-1">
                        <span>Processed: {formatDate(payout.processedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Failure Reason */}
                  {payout.status === "failed" && payout.failureReason && (
                    <div className="text-xs sm:text-sm text-red-600 bg-red-50 px-2 py-1 rounded-lg inline-block">
                      {payout.failureReason}
                    </div>
                  )}
                </div>

                {/* Right Section - Amount & Action */}
                <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-4">
                  {/* Amount */}
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-1 text-sm sm:text-base font-bold text-gray-900">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{(payout.amount || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Payout Amount</p>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm"
                  >
                    View Details
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
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

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Search and Filter Skeleton */}
      <div className="mb-6">
        <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Skeleton className="h-10 sm:h-12 w-full flex-1" />
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 sm:h-10 w-full sm:w-40 lg:w-48 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Payout Cards Skeleton */}
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
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full mb-4 sm:mb-6">
        <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No payouts found"
          : "No payouts yet"}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} payouts`
            : "Your payout history will appear here once you request payouts"}
      </p>
    </div>
  );
}
