"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  Briefcase,
  CreditCard,
  Smartphone,
  Building,
  Landmark,
  Search,
  Filter,
  FileText,
  X,
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

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded";
  paymentMethod?: string | null;
  gateway?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: string;
  refundReason?: string;
  invoiceId?: string;
  metadata?: {
    customerId?: string;
    invoiceNumber?: string;
  };
  gatewayResponse?: any;
}

type StatusFilter = "all" | "completed" | "pending" | "failed" | "refunded";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Payments" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

// Payment method filters - not currently used since paymentMethod is null in API response
// const paymentMethodFilters = [
//   { value: "all", label: "All Methods" },
//   { value: "card", label: "Card" },
//   { value: "upi", label: "UPI" },
//   { value: "netbanking", label: "Net Banking" },
//   { value: "wallet", label: "Wallet" },
// ];

export default function AdminPaymentsHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const paymentsPerPage = 10;

  useEffect(() => {
    loadPayments();
  }, [currentPage]);

  useEffect(() => {
    filterPayments();
  }, [payments, statusFilter, searchQuery]);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getAllPayments({
        page: currentPage,
        limit: paymentsPerPage,
      });

      const apiData = (response as any).data || response;
      const paymentsArray = Array.isArray(apiData)
        ? apiData
        : apiData.payments || [];

      setPayments(paymentsArray);

      // Fetch invoice details for each payment
      const invoicesMap: Record<string, any> = {};
      for (const payment of paymentsArray) {
        if (payment.invoiceId && !invoicesMap[payment.invoiceId]) {
          try {
            const invoiceResponse = await adminApi.getInvoice(
              payment.invoiceId,
            );
            const invoiceData =
              (invoiceResponse as any).data || invoiceResponse;
            invoicesMap[payment.invoiceId] = invoiceData;
          } catch (err) {
            console.error("Failed to load invoice:", payment.invoiceId);
          }
        }
      }
      setInvoices(invoicesMap);

      // Get total count from response
      const totalCount =
        (response as any).totalCount ||
        apiData.totalCount ||
        paymentsArray.length;
      setTotalPayments(
        typeof totalCount === "number" ? totalCount : paymentsArray.length,
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load payments";
      toast.error(message);
      setPayments([]);
      setTotalPayments(0);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((payment) => {
        return (
          payment.gatewayPaymentId?.toLowerCase().includes(query) ||
          payment.gatewayOrderId?.toLowerCase().includes(query) ||
          payment.metadata?.invoiceNumber?.toLowerCase().includes(query) ||
          invoices[payment.invoiceId ?? ""]?.customer?.name
            ?.toLowerCase()
            .includes(query) ||
          invoices[payment.invoiceId ?? ""]?.serviceProvider?.name
            ?.toLowerCase()
            .includes(query) ||
          invoices[payment.invoiceId ?? ""]?.serviceProvider?.businessName
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    setFilteredPayments(filtered);
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
      case "processing":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            {status === "processing" ? "Processing" : "Pending"}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "refunded":
      case "partially_refunded":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
            <XCircle className="h-3 w-3 mr-1" />
            {status === "partially_refunded"
              ? "Partially Refunded"
              : "Refunded"}
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "upi":
        return <Smartphone className="h-4 w-4" />;
      case "netbanking":
        return <Building className="h-4 w-4" />;
      case "wallet":
        return <Wallet className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={() => router.push("/admin/payments")}
        >
          <X className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Payment History
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
            View all payment transactions
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Completed */}
        <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-emerald-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-semibold">
              Completed
            </Badge>
          </div>
          <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-emerald-900 uppercase tracking-wide mb-1">
            Completed Payments
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            {payments.filter((p) => p.status === "completed").length}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-semibold">
              Pending
            </Badge>
          </div>
          <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-amber-900 uppercase tracking-wide mb-1">
            Pending Payments
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            {
              payments.filter(
                (p) => p.status === "pending" || p.status === "processing",
              ).length
            }
          </p>
        </div>

        {/* Failed */}
        <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-red-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <Badge className="bg-red-100 text-red-800 text-[10px] sm:text-xs font-semibold">
              Failed
            </Badge>
          </div>
          <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-red-900 uppercase tracking-wide mb-1">
            Failed Payments
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            {payments.filter((p) => p.status === "failed").length}
          </p>
        </div>

        {/* Refunded */}
        <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
              <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-semibold">
              Refunded
            </Badge>
          </div>
          <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-purple-900 uppercase tracking-wide mb-1">
            Refunded Payments
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            {
              payments.filter(
                (p) =>
                  p.status === "refunded" || p.status === "partially_refunded",
              ).length
            }
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by transaction ID, invoice, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 h-10 sm:h-12 text-sm border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 sm:w-auto">
            <span className="text-xs sm:text-sm font-semibold text-blue-700">
              Status:
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow h-10 sm:h-12">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-200 shadow-lg">
                {statusFilters.map((filter) => (
                  <SelectItem
                    key={filter.value}
                    value={filter.value}
                    className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer"
                  >
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payment List */}
      {filteredPayments.length > 0 ? (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 px-2">
            <p>
              Showing {filteredPayments.length} of {totalPayments} payments
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Transaction ID
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Invoice
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Provider
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono">
                          {payment.gatewayPaymentId ||
                            payment.gatewayOrderId ||
                            payment.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        {payment.invoiceId ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/payments/invoices/${payment.invoiceId}`,
                              )
                            }
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            {payment.metadata?.invoiceNumber ||
                              invoices[payment.invoiceId ?? ""]
                                ?.invoiceNumber ||
                              "N/A"}
                          </button>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-400 shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-900 truncate">
                            {invoices[payment.invoiceId ?? ""]?.customer
                              ?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <Briefcase className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-400 shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-900 truncate">
                            {invoices[payment.invoiceId ?? ""]?.serviceProvider
                              ?.name ||
                              invoices[payment.invoiceId ?? ""]?.serviceProvider
                                ?.businessName ||
                              "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.status === "partially_refunded" &&
                          payment.refundAmount && (
                            <p className="text-[10px] sm:text-xs text-red-600">
                              Refunded: {formatCurrency(payment.refundAmount)}
                            </p>
                          )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="text-[10px] sm:text-xs text-gray-600">
                          <div>{formatDate(payment.initiatedAt)}</div>
                          {payment.completedAt && (
                            <div className="text-emerald-600">
                              Completed: {formatDate(payment.completedAt)}
                            </div>
                          )}
                          {payment.failedAt && (
                            <div className="text-red-600">
                              Failed: {formatDate(payment.failedAt)}
                            </div>
                          )}
                          {payment.refundedAt && (
                            <div className="text-purple-600">
                              Refunded: {formatDate(payment.refundedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {payment.gatewayPaymentId ||
                          payment.gatewayOrderId ||
                          payment.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Amount</span>
                    <span className="font-bold text-gray-900 text-xs">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  {payment.invoiceId && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">Invoice</span>
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/payments/invoices/${payment.invoiceId}`,
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline truncate ml-2"
                      >
                        {payment.metadata?.invoiceNumber ||
                          invoices[payment.invoiceId ?? ""]?.invoiceNumber ||
                          "N/A"}
                      </button>
                    </div>
                  )}
                  {invoices[payment.invoiceId ?? ""]?.customer?.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">Customer</span>
                      <span className="text-gray-900 text-xs truncate ml-2">
                        {invoices[payment.invoiceId ?? ""]?.customer?.name}
                      </span>
                    </div>
                  )}
                  {invoices[payment.invoiceId ?? ""]?.serviceProvider?.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">Provider</span>
                      <span className="text-gray-900 text-xs truncate ml-2">
                        {invoices[payment.invoiceId ?? ""]?.serviceProvider
                          ?.name ||
                          invoices[payment.invoiceId ?? ""]?.serviceProvider
                            ?.businessName ||
                          "N/A"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Date</span>
                    <span className="text-gray-900 text-xs">
                      {formatDate(payment.initiatedAt)}
                    </span>
                  </div>
                  {payment.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">Completed</span>
                      <span className="text-emerald-600 text-xs">
                        {formatDate(payment.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPayments > paymentsPerPage && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold">Page {currentPage}</span> of{" "}
                  {Math.ceil(totalPayments / paymentsPerPage)}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(totalPayments / paymentsPerPage) },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-linear-to-r from-blue-400 to-indigo-400 text-white shadow-md"
                            : "border border-blue-200 text-gray-700 hover:bg-blue-50"
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
                          Math.ceil(totalPayments / paymentsPerPage),
                        ),
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(totalPayments / paymentsPerPage)
                    }
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 w-24 sm:h-10 sm:w-32 mb-2" />
        <Skeleton className="h-8 w-40 sm:h-10 sm:w-64 mb-2" />
        <Skeleton className="h-4 w-48 sm:h-5 sm:w-96" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-20 sm:h-24 lg:h-28 rounded-xl sm:rounded-2xl"
          />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="flex-1 h-10 sm:h-12" />
          <Skeleton className="h-10 w-32 sm:h-12 sm:w-40" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 sm:h-20 w-full" />
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
    <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg border-2 border-blue-100 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full mb-4 sm:mb-6">
        <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No payments found"
          : "No payments yet"}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} payments`
            : "Payment transactions will appear here when customers complete payments"}
      </p>
    </div>
  );
}
