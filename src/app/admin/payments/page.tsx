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
  Download,
  Filter,
  User,
  FileText,
  CreditCard,
  Smartphone,
  Building,
  Landmark,
  WalletCards,
  Lightbulb,
  Info,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentStats {
  totalRevenue: string;
  pendingPayments: string;
  platformFees: string;
  providerEarnings: string;
  completedPayments: number;
  pendingPaymentsCount: number;
  refundedPayments: number;
  revenueChange?: string;
  paymentChange?: string;
}

interface Payment {
  id: string;
  amount: string;
  status: string;
  paymentMethod: string;
  gateway?: string;
  completedAt?: string;
  metadata?: any;
  gatewayResponse?: any;
  invoice?: {
    invoiceNumber: string;
    customer?: {
      name: string;
    };
    provider?: {
      name: string;
    };
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  invoiceDate: string;
  dueDate?: string;
  provider?: {
    name: string;
  };
  customer?: {
    name: string;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );

  useEffect(() => {
    loadPaymentData();
  }, [timeRange]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Load payment stats
      try {
        const statsResponse = await adminApi.getPaymentStats();

        const statsData = (statsResponse as any).data || statsResponse;

        // Transform backend stats to frontend format
        const completedAmount = parseFloat(statsData.completedAmount || 0);
        // Calculate platform fees (typically 10-20% of revenue, using 15% as default)
        const platformFees = (completedAmount * 0.15).toFixed(2);
        const providerEarnings = (
          completedAmount - parseFloat(platformFees)
        ).toFixed(2);

        const transformedStats = {
          totalRevenue: completedAmount.toString(),
          pendingPayments: "0", // Will be calculated from pending invoices
          platformFees: platformFees,
          providerEarnings: providerEarnings,
          completedPayments: statsData.completed || 0,
          pendingPaymentsCount: statsData.pending || 0,
          refundedPayments: statsData.failed || 0,
          revenueChange: "0", // Backend doesn't provide this yet
          paymentChange: "0", // Backend doesn't provide this yet
        };
        setStats(transformedStats);
      } catch (statsError) {
        console.warn(
          "Payment stats endpoint not available, using mock data",
          statsError,
        );
        setStats({
          totalRevenue: "0",
          pendingPayments: "0",
          platformFees: "0",
          providerEarnings: "0",
          completedPayments: 0,
          pendingPaymentsCount: 0,
          refundedPayments: 0,
          revenueChange: "0",
          paymentChange: "0",
        });
      }

      // Load recent payments
      try {
        const paymentsResponse = await adminApi.getAllPayments({
          limit: 10,
        });

        const paymentsData = (paymentsResponse as any).data || paymentsResponse;
        const paymentsArray = Array.isArray(paymentsData)
          ? paymentsData
          : paymentsData.payments || [];

        // Transform payments and fetch customer details
        const transformedPayments = await Promise.all(
          paymentsArray.slice(0, 5).map(async (payment: any) => {
            let customerName = "Customer";
            let invoiceNumber =
              payment.metadata?.invoiceNumber ||
              `INV-${payment.id.slice(0, 8)}`;

            // Try to fetch invoice details to get customer information
            if (payment.invoiceId) {
              try {
                const invoiceResponse = await adminApi.getInvoice(
                  payment.invoiceId,
                );

                const invoiceData =
                  (invoiceResponse as any).data || invoiceResponse;

                if (invoiceData) {
                  invoiceNumber = invoiceData.invoiceNumber || invoiceNumber;

                  // Use customer data from invoice (already populated)
                  if (invoiceData.customer?.name) {
                    customerName = invoiceData.customer.name;
                  }
                  // Fallback: Check if customer is nested differently
                  else if (typeof invoiceData.customer === "string") {
                    try {
                      const customerObj = JSON.parse(invoiceData.customer);
                      if (customerObj.name) {
                        customerName = customerObj.name;
                      }
                    } catch (e) {
                      // Could not parse customer JSON
                    }
                  }
                  // Last resort: Fetch customer separately
                  else if (invoiceData.customerId) {
                    try {
                      const customerResponse = await adminApi.getCustomer(
                        invoiceData.customerId,
                      );
                      const customerData =
                        (customerResponse as any).data || customerResponse;

                      if (customerData?.name) {
                        customerName = customerData.name;
                      }
                    } catch (custErr) {
                      // Could not fetch customer
                    }
                  }
                }
              } catch (invoiceErr: any) {
                // Could not fetch invoice, continue with fallbacks
              }
            }

            // Fallback: Extract customer name from payment metadata
            if (customerName === "Customer") {
              if (payment.metadata?.customerName) {
                customerName = payment.metadata.customerName;
              } else if (payment.gatewayResponse?.description) {
                const descMatch =
                  payment.gatewayResponse.description.match(/for\s+(.+?)\s+/i);
                if (descMatch) {
                  customerName = descMatch[1];
                }
              } else if (payment.metadata?.customerEmail) {
                customerName = payment.metadata.customerEmail.split("@")[0];
                customerName =
                  customerName.charAt(0).toUpperCase() + customerName.slice(1);
              }
            }

            // Determine payment method for icon (online vs cash)
            const isOnlinePayment =
              payment.gateway === "stripe" || payment.gateway === "razorpay";
            const paymentMethodType = isOnlinePayment
              ? payment.paymentMethod || "card"
              : "cash";

            return {
              ...payment,
              paymentMethod: paymentMethodType,
              gateway: payment.gateway || "manual",
              invoice: {
                invoiceNumber: invoiceNumber,
                customer: {
                  name: customerName,
                },
                provider: {
                  name: "Provider",
                },
              },
            };
          }),
        );

        setRecentPayments(transformedPayments);
      } catch (paymentsError) {
        console.warn(
          "Payments endpoint not available, using empty data",
          paymentsError,
        );
        setRecentPayments([]);
      }

      // Load pending invoices
      try {
        const invoicesResponse = await adminApi.getAllInvoices({
          status: 'pending',
          limit: 50  // Increased limit to get all pending invoices
        });

        const invoicesData = (invoicesResponse as any).data?.invoices ||
                             (invoicesResponse as any).data ||
                             invoicesResponse;

        const invoicesArray = Array.isArray(invoicesData)
          ? invoicesData
          : invoicesData.invoices || [];

        // Calculate total pending payments amount
        const pendingTotal = invoicesArray.reduce((sum: number, invoice: any) => {
          const amount = parseFloat(invoice.totalAmount || invoice.amount || 0);
          return sum + amount;
        }, 0);

        // Update stats with pending payments total
        setStats((prevStats) => {
          if (!prevStats) return prevStats;
          return {
            ...prevStats,
            pendingPayments: pendingTotal.toFixed(2),
            pendingPaymentsCount: invoicesArray.length, // Update count to match actual invoices
          };
        });

        // Show first 5 invoices in the UI
        setPendingInvoices(invoicesArray.slice(0, 5));
      } catch (invoicesError) {
        console.warn('Could not load pending invoices:', invoicesError);
        setPendingInvoices([]);
      }
    } catch (error: any) {
      console.error("Error loading payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodIcon = (method: string | null | undefined) => {
    if (!method) return <Banknote className="h-5 w-5 text-green-600" />;

    const methodLower = method.toLowerCase();

    // Cash/Manual payments
    if (methodLower === "cash" || methodLower === "manual") {
      return <Banknote className="h-5 w-5 text-green-600" />;
    }

    // Online payments
    switch (methodLower) {
      case "card":
        return <CreditCard className="h-5 w-5 text-violet-600" />;
      case "upi":
        return <Smartphone className="h-5 w-5 text-emerald-600" />;
      case "netbanking":
        return <Building className="h-5 w-5 text-indigo-600" />;
      case "wallet":
        return <WalletCards className="h-5 w-5 text-purple-600" />;
      case "stripe":
        return <CreditCard className="h-5 w-5 text-violet-600" />;
      default:
        return <Wallet className="h-5 w-5 text-violet-600" />;
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Payment Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track revenue, payments, and provider earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32 sm:w-40 border-violet-200">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={() => router.push("/admin/payments/invoices")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Manage Invoices
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            {stats?.revenueChange && (
              <Badge
                className={`text-xs font-semibold ${
                  parseFloat(stats.revenueChange) >= 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {parseFloat(stats.revenueChange) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(parseFloat(stats.revenueChange))}%
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-green-900 uppercase tracking-wide mb-1">
            Total Revenue
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : "₹0"}
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 sm:p-6 border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs font-semibold">
              {stats?.pendingPaymentsCount || 0} pending
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-yellow-900 uppercase tracking-wide mb-1">
            Pending Payments
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {stats?.pendingPayments
              ? formatCurrency(stats.pendingPayments)
              : "₹0"}
          </p>
        </div>

        {/* Platform Fees */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border-2 border-violet-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-violet-900 uppercase tracking-wide mb-1">
            Platform Fees
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {stats?.platformFees ? formatCurrency(stats.platformFees) : "₹0"}
          </p>
        </div>

        {/* Provider Earnings */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-purple-900 uppercase tracking-wide mb-1">
            Provider Earnings
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {stats?.providerEarnings
              ? formatCurrency(stats.providerEarnings)
              : "₹0"}
          </p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">
                Completed
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {stats?.completedPayments || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            <div>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">
                Pending
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {stats?.pendingPaymentsCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <div>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">
                Refunded
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {stats?.refundedPayments || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            <div>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">
                Avg Payment
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {stats?.totalRevenue && stats?.completedPayments
                  ? formatCurrency(
                      parseFloat(stats.totalRevenue) / stats.completedPayments,
                    )
                  : "₹0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments & Pending Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Recent Payments
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Latest completed transactions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/payments/history")}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => {
                const isOnline =
                  payment.gateway === "stripe" ||
                  payment.gateway === "razorpay";
                const paymentTypeLabel = isOnline ? "Online" : "Cash";
                const paymentTypeColor = isOnline
                  ? "bg-violet-100 text-violet-700 border-violet-200"
                  : "bg-green-100 text-green-700 border-green-200";

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center justify-center shrink-0">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {payment.invoice?.customer?.name || "Customer"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] sm:text-xs text-gray-600">
                            {payment.invoice?.invoiceNumber || "N/A"}
                          </p>
                          <span
                            className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md border ${paymentTypeColor} font-medium`}
                          >
                            {paymentTypeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        {payment.completedAt
                          ? formatDate(payment.completedAt)
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-3 sm:mb-4">
                  <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  No Payments Yet
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto px-4">
                  Payment transactions will appear here once customers start
                  paying for services through the platform.
                </p>
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-violet-50 rounded-xl border border-violet-200 max-w-md mx-auto">
                  <p className="text-xs sm:text-sm text-gray-700 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Tip:</strong> To test the payment system, complete
                      a service request as a customer and proceed to payment.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Pending Invoices
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Awaiting payment from customers
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/payments/invoices")}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {pendingInvoices.length > 0 ? (
              pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/payments/invoices/${invoice.id}`)
                  }
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {invoice.customer?.name || "Customer"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <Badge
                      className={`text-[10px] sm:text-xs ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full mb-3 sm:mb-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-violet-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  No Pending Invoices
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto px-4">
                  Invoices will be generated when service requests are completed
                  and awaiting payment.
                </p>
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-violet-50 rounded-xl border border-violet-200 max-w-md mx-auto">
                  <p className="text-xs sm:text-sm text-gray-700 flex items-start gap-2">
                    <Info className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Info:</strong> Invoices are automatically created
                      when providers mark a service as "completed".
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border-2 border-violet-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/payments/invoices")}
            className="justify-start border-violet-200 text-violet-700 hover:bg-violet-50 h-auto py-3 px-4"
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold">
                Manage Invoices
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">
                View all invoices
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/payments/history")}
            className="justify-start border-violet-200 text-violet-700 hover:bg-violet-50 h-auto py-3 px-4"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold">
                Payment History
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">
                View transactions
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/payments/distribute")}
            className="justify-start border-violet-200 text-violet-700 hover:bg-violet-50 h-auto py-3 px-4"
          >
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold">
                Distribute to Providers
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">
                Process payouts
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/payments/providers")}
            className="justify-start border-violet-200 text-violet-700 hover:bg-violet-50 h-auto py-3 px-4"
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold">
                Provider Earnings
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">
                View breakdown
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
