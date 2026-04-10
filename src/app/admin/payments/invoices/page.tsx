"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  FileText,
  Calendar,
  IndianRupee,
  User,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: string;
  invoiceNumber: string;
  requestId: string;
  totalAmount: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  subtotal?: string;
  materialCost?: string;
  laborCost?: string;
  taxAmount?: string;
  taxRate?: string;
  platformFee?: string;
  providerEarning?: string;
  serviceProvider?: {
    name?: string;
    businessName?: string;
    contactPerson?: string;
    id: string;
  };
  customer?: {
    name: string;
    id: string;
  };
  serviceRequest?: {
    title?: string;
    serviceType?: string;
  };
  lineItems?: any[];
}

type StatusFilter = "all" | "pending" | "paid" | "overdue" | "cancelled";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Invoices" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const invoicesPerPage = 10;

  useEffect(() => {
    loadInvoices();
  }, [currentPage]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchQuery]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getAllInvoices({
        page: currentPage,
        limit: invoicesPerPage,
      });

      const apiData = (response as any).data || response;
      const invoicesArray = Array.isArray(apiData)
        ? apiData
        : apiData.invoices || [];

      setInvoices(invoicesArray);

      // Get total count from response
      const totalCount =
        (response as any).totalCount ||
        apiData.totalCount ||
        invoicesArray.length;
      setTotalInvoices(
        typeof totalCount === "number" ? totalCount : invoicesArray.length,
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load invoices";
      toast.error(message);
      setInvoices([]);
      setTotalInvoices(0);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber?.toLowerCase().includes(query) ||
          invoice.customer?.name?.toLowerCase().includes(query) ||
          invoice.serviceProvider?.name?.toLowerCase().includes(query) ||
          invoice.serviceProvider?.businessName?.toLowerCase().includes(query) ||
          invoice.serviceProvider?.contactPerson?.toLowerCase().includes(query) ||
          (
            invoice.serviceRequest?.title ||
            invoice.serviceRequest?.serviceType ||
            ""
          )
            .toLowerCase()
            .includes(query),
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
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
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="outline"
          className="border-violet-200 text-violet-700 hover:bg-violet-50"
          onClick={() => router.push("/admin/payments")}
        >
          <X className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Invoice Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View and manage all service invoices
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending */}
        <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 sm:p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 text-xs font-semibold">
              Pending
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-amber-900 uppercase tracking-wide mb-1">
            Pending Invoices
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {invoices.filter((inv) => inv.status === "pending").length}
          </p>
        </div>

        {/* Paid */}
        <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-2xl p-4 sm:p-6 border-2 border-emerald-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
              Paid
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-emerald-900 uppercase tracking-wide mb-1">
            Paid Invoices
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {invoices.filter((inv) => inv.status === "paid").length}
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-2xl p-4 sm:p-6 border-2 border-red-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-red-100 text-red-800 text-xs font-semibold">
              Overdue
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-red-900 uppercase tracking-wide mb-1">
            Overdue Invoices
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {invoices.filter((inv) => inv.status === "overdue").length}
          </p>
        </div>

        {/* Cancelled */}
        <div className="bg-linear-to-br from-gray-50 to-slate-50 rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-gray-100 text-gray-800 text-xs font-semibold">
              Cancelled
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
            Cancelled Invoices
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {invoices.filter((inv) => inv.status === "cancelled").length}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by invoice number, customer name, or provider name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-3 sm:w-auto">
            <span className="text-sm font-semibold text-violet-700">
              Status:
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-48 border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-violet-500" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border border-violet-200 shadow-lg">
                {statusFilters.map((filter) => (
                  <SelectItem
                    key={filter.value}
                    value={filter.value}
                    className="hover:bg-violet-50 focus:bg-violet-100 cursor-pointer"
                  >
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length > 0 ? (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 px-2">
            <p>
              Showing {filteredInvoices.length} of {totalInvoices} invoices
            </p>
          </div>

          <div className="hidden sm:block bg-white rounded-2xl shadow-lg border-2 border-violet-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-violet-50 to-indigo-50 border-b-2 border-violet-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((invoice, index) => {
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-violet-50/50 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/payments/invoices/${invoice.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {invoice.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {invoice.customer?.name || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {invoice.serviceProvider?.name ||
                                invoice.serviceProvider?.businessName ||
                                invoice.serviceProvider?.contactPerson ||
                                "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(invoice.invoiceDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/admin/payments/invoices/${invoice.id}`,
                                );
                              }}
                              className="border-violet-200 text-violet-700 hover:bg-violet-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() =>
                  router.push(`/admin/payments/invoices/${invoice.id}`)
                }
                className="bg-white rounded-xl shadow-lg border-2 border-violet-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        ID: {invoice.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Customer</span>
                    <span className="font-medium text-gray-900 text-xs truncate ml-2">
                      {invoice.customer?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Provider</span>
                    <span className="font-medium text-gray-900 text-xs truncate ml-2">
                      {invoice.serviceProvider?.name ||
                        invoice.serviceProvider?.businessName ||
                        invoice.serviceProvider?.contactPerson ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Amount</span>
                    <span className="font-bold text-gray-900 text-xs">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Date</span>
                    <span className="text-gray-900 text-xs">
                      {formatDate(invoice.invoiceDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalInvoices > invoicesPerPage && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold">Page {currentPage}</span> of{" "}
                  {Math.ceil(totalInvoices / invoicesPerPage)}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-violet-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(totalInvoices / invoicesPerPage) },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-linear-to-r from-violet-400 to-indigo-400 text-white shadow-md"
                            : "border border-violet-200 text-gray-700 hover:bg-violet-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(totalInvoices / invoicesPerPage),
                        ),
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(totalInvoices / invoicesPerPage)
                    }
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-violet-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="flex-1 h-12" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-100 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
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
    <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-violet-100 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-violet-100 to-indigo-100 rounded-full mb-6">
        <FileText className="h-10 w-10 text-violet-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No invoices found"
          : "No invoices yet"}
      </h3>
      <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} invoices`
            : "Invoices will be generated when service requests are completed"}
      </p>
    </div>
  );
}
