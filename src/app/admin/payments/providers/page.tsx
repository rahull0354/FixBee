"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  ArrowLeft,
  Search,
  User,
  Wallet,
  CheckCircle,
  Clock,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProviderEarning {
  providerId: string;
  providerName: string;
  providerEmail: string;
  totalEarnings: number;
  pendingEarnings: number;
  completedPayments: number;
  pendingPayments: number;
  averageRating?: number;
  totalServices: number;
  lastPaymentDate?: string;
  bankDetailsVerified: boolean;
}

interface EarningsStats {
  totalProviders: number;
  totalEarnings: number;
  pendingEarnings: number;
  completedPayouts: number;
  pendingPayouts: number;
}

export default function ProviderEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<ProviderEarning[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadProviderEarnings();
  }, []);

  const loadProviderEarnings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProviderEarnings();
      const data = (response as any).data || response;

      if (data.earnings && Array.isArray(data.earnings)) {
        setEarnings(data.earnings);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error("Error loading provider earnings:", error);
      toast.error("Failed to load provider earnings");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Pagination logic
  const filteredEarnings = earnings.filter((earning) => {
    const matchesSearch =
      earning.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.providerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEarnings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEarnings = filteredEarnings.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/payments")}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Button>

          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Provider Earnings
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                View and manage provider earnings breakdown
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/admin/payments/distribute")}
                className="text-white gap-2 bg-violet-600 hover:bg-violet-700 whitespace-nowrap"
              >
                <Wallet className="h-4 w-4" />
                Distribute Payments
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <User className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Providers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalProviders}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Earnings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(stats.pendingEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completed Payouts</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.completedPayouts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 border-violet-200 focus:border-violet-400 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {startIndex + 1}-{Math.min(endIndex, filteredEarnings.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredEarnings.length}
            </span>{" "}
            providers
          </p>
          <p>
            Page{" "}
            <span className="font-semibold text-gray-900">{currentPage}</span>{" "}
            of {totalPages}
          </p>
        </div>

        {/* Earnings Table - Responsive */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile Card View (< sm) */}
          <div className="sm:hidden divide-y divide-gray-200">
            {currentEarnings.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                No provider earnings found
              </div>
            ) : (
              currentEarnings.map((earning) => (
                <div key={earning.providerId} className="p-4 space-y-3">
                  {/* Provider Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {earning.providerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {earning.providerName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {earning.providerEmail}
                      </p>
                    </div>
                  </div>

                  {/* Earnings Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-gray-600 mb-1">
                        Total Earnings
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        {formatCurrency(earning.totalEarnings)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {earning.completedPayments} payments
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <p className="text-xs text-gray-600 mb-1">Pending</p>
                      <p className="text-sm font-bold text-yellow-700">
                        {formatCurrency(earning.pendingEarnings)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {earning.pendingPayments} pending
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Services:</span>
                      <span className="font-semibold text-gray-900">
                        {earning.totalServices}
                      </span>
                    </div>
                    {earning.averageRating != null &&
                      !isNaN(earning.averageRating) && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-gray-900">
                            {Number(earning.averageRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentEarnings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 sm:px-6 py-12 text-center text-gray-500"
                    >
                      No provider earnings found
                    </td>
                  </tr>
                ) : (
                  currentEarnings.map((earning) => (
                    <tr key={earning.providerId} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {earning.providerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {earning.providerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {earning.providerEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(earning.totalEarnings)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {earning.completedPayments} payments
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-semibold text-yellow-700">
                          {formatCurrency(earning.pendingEarnings)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {earning.pendingPayments} pending
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {earning.totalServices}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {earning.averageRating != null &&
                        !isNaN(earning.averageRating) ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium text-gray-900">
                              {Number(earning.averageRating).toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No rating
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="gap-1 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={
                      currentPage === page
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "border-violet-200 text-violet-700 hover:bg-violet-50"
                    }
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="gap-1 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
