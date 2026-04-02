"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  DollarSign,
  Wallet,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Send,
  Calendar,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  Building,
  Mail,
  Phone,
  Eye,
  User,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

interface ProviderEarning {
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerPhone?: string;
  totalEarnings: string;
  paidAmount: string;
  pendingAmount: string;
  completedInvoices: number;
  pendingInvoices: number;
  lastPayoutDate?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  invoiceIds?: string[];
  invoices?: any[];
  payoutId?: string;
}

interface Payout {
  id: string;
  providerId: string;
  providerName: string;
  amount: string;
  status: "pending" | "processing" | "completed" | "failed";
  method: string;
  transactionId?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export default function ProviderPayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providerEarnings, setProviderEarnings] = useState<ProviderEarning[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [stats, setStats] = useState({
    totalPendingPayouts: "0",
    totalProcessedPayouts: "0",
    providersWithPending: 0,
    averagePayoutAmount: "0",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Payout Dialog
  const [selectedProvider, setSelectedProvider] = useState<ProviderEarning | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("bank_transfer");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  // View Details Dialog
  const [viewingProvider, setViewingProvider] = useState<ProviderEarning | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    try {
      setLoading(true);

      // Load pending payouts
      try {
        const pendingResponse = await adminApi.getPendingPayouts({
          limit: 50,
        });
        console.log("💰 PENDING PAYOUTS RESPONSE:", JSON.stringify(pendingResponse, null, 2));

        const pendingData = (pendingResponse as any).data?.payouts ||
                           (pendingResponse as any).data ||
                           pendingResponse;
        console.log("💰 PENDING DATA:", pendingData);

        const pendingArray = Array.isArray(pendingData)
          ? pendingData
          : pendingData.payouts || [];
        console.log("💰 PENDING ARRAY:", pendingArray);

        // Transform pending payouts to provider earnings format
        const transformedEarnings = pendingArray.map((payout: any) => ({
          providerId: payout.providerId || "",
          providerName: payout.provider?.name || "Unknown Provider",
          providerEmail: payout.provider?.email || "",
          providerPhone: payout.provider?.phone || "",
          totalEarnings: payout.totalAmount || "0",
          paidAmount: "0", // These are pending payouts, so paid amount is 0
          pendingAmount: payout.totalAmount || "0",
          completedInvoices: payout.invoiceCount || 0,
          pendingInvoices: payout.invoiceCount || 0,
          lastPayoutDate: undefined,
          bankDetails: undefined,
          payoutId: undefined,
          invoiceIds: payout.invoiceIds || [],
          invoices: payout.invoices || [],
        }));

        console.log("✅ TRANSFORMED EARNINGS:", transformedEarnings);
        setProviderEarnings(transformedEarnings);

        // Calculate stats from actual data
        const totalPending = transformedEarnings.reduce(
          (sum: number, p: ProviderEarning) => sum + parseFloat(p.pendingAmount || "0"),
          0
        );
        const providersWithPending = transformedEarnings.length;
        const avgPayout = providersWithPending > 0 ? totalPending / providersWithPending : 0;

        setStats({
          totalPendingPayouts: totalPending.toFixed(2),
          totalProcessedPayouts: "0", // Will be loaded from history
          providersWithPending,
          averagePayoutAmount: avgPayout.toFixed(2),
        });
      } catch (pendingError) {
        console.warn("Could not load pending payouts:", pendingError);
        setProviderEarnings([]);
      }

      // Load payout history
      try {
        const historyResponse = await adminApi.getPayouts({
          limit: 20,
        });
        console.log("📜 PAYOUT HISTORY RESPONSE:", JSON.stringify(historyResponse, null, 2));

        const historyData = (historyResponse as any).data?.payouts ||
                           (historyResponse as any).data ||
                           historyResponse;

        const historyArray = Array.isArray(historyData)
          ? historyData
          : historyData.payouts || [];

        console.log("📜 HISTORY ARRAY:", historyArray);
        setPayoutHistory(historyArray);

        // Calculate total processed from history
        const totalProcessed = historyArray
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);

        setStats((prevStats) => ({
          ...prevStats,
          totalProcessedPayouts: totalProcessed.toFixed(2),
        }));
      } catch (historyError) {
        console.warn("Could not load payout history:", historyError);
        setPayoutHistory([]);
      }
    } catch (error: any) {
      console.error("Error loading payout data:", error);
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedProvider || !payoutAmount) {
      toast.error("Please provide all required information");
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (amount > parseFloat(selectedProvider.pendingAmount)) {
      toast.error("Amount cannot exceed pending balance");
      return;
    }

    try {
      setProcessingPayout(true);

      // Step 1: Initiate payout
      const initiateResponse = await adminApi.initiatePayout(selectedProvider.providerId, {
        amount,
        notes: payoutNotes,
      });

      const payoutData = (initiateResponse as any).data || initiateResponse;
      const payoutId = payoutData.id || payoutData.payoutId;

      if (!payoutId) {
        throw new Error("Payout initiation failed - no payout ID returned");
      }

      // Step 2: Process the payout
      await adminApi.processPayout(payoutId, {
        notes: payoutNotes,
      });

      toast.success("Payout initiated successfully! It will be processed shortly.");
      setShowPayoutDialog(false);
      setSelectedProvider(null);
      setPayoutAmount("");
      setPayoutNotes("");

      // Reload data
      await loadPayoutData();
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast.error(error?.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessingPayout(false);
    }
  };

  const openPayoutDialog = (provider: ProviderEarning) => {
    setSelectedProvider(provider);
    setPayoutAmount(provider.pendingAmount);
    setPayoutMethod("bank_transfer");
    setPayoutNotes("");
    setShowPayoutDialog(true);
  };

  const openDetailsDialog = (provider: ProviderEarning) => {
    setViewingProvider(provider);
    setShowDetailsDialog(true);
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
      case "processing":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredEarnings = providerEarnings.filter((earning) => {
    const providerName = (earning.providerName || "").toLowerCase();
    const providerEmail = (earning.providerEmail || "").toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      providerName.includes(searchLower) ||
      providerEmail.includes(searchLower);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && parseFloat(earning.pendingAmount || "0") > 0) ||
      (statusFilter === "cleared" && parseFloat(earning.pendingAmount || "0") === 0);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Provider Payouts
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage and process provider earnings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push("/admin/payments/distribute/history")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Payout History
            </Button>
            <Button
              className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
              onClick={() => loadPayoutData()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Pending Payouts */}
        <div className="bg-linear-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 sm:p-6 border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs font-semibold">
              {stats.providersWithPending} providers
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-yellow-900 uppercase tracking-wide mb-1">
            Pending Payouts
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalPendingPayouts)}
          </p>
        </div>

        {/* Total Processed Payouts */}
        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-green-900 uppercase tracking-wide mb-1">
            Processed Payouts
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalProcessedPayouts)}
          </p>
        </div>

        {/* Providers with Pending */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-blue-900 uppercase tracking-wide mb-1">
            Providers Awaiting
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {stats.providersWithPending}
          </p>
        </div>

        {/* Average Payout Amount */}
        <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-purple-900 uppercase tracking-wide mb-1">
            Avg. Payout
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(stats.averagePayoutAmount)}
          </p>
        </div>
      </div>

      {/* Provider Earnings List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Provider Earnings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage payouts to service providers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-blue-200 h-12"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-200 shadow-lg">
                <SelectItem value="all" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">All Providers</SelectItem>
                <SelectItem value="pending" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Has Pending</SelectItem>
                <SelectItem value="cleared" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Cleared</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredEarnings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {filteredEarnings.map((earning) => {
              const hasPending = parseFloat(earning.pendingAmount) > 0;

              return (
                <div
                  key={earning.providerId}
                  className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Header */}
                  <div className="bg-linear-to-r from-sky-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">
                            {earning.providerName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {earning.providerEmail}
                            </span>
                            {earning.providerPhone && (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {earning.providerPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {hasPending ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs sm:text-sm font-semibold">
                          Payment Pending
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm font-semibold">
                          Cleared
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      {/* Total Earnings */}
                      <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] sm:text-xs font-semibold text-blue-900 uppercase tracking-wide">
                            Total Earnings
                          </p>
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {formatCurrency(earning.totalEarnings)}
                        </p>
                      </div>

                      {/* Paid Amount */}
                      <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] sm:text-xs font-semibold text-green-900 uppercase tracking-wide">
                            Paid Amount
                          </p>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">
                          {formatCurrency(earning.paidAmount)}
                        </p>
                      </div>

                      {/* Pending Amount */}
                      <div className={`${hasPending ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-200'} rounded-xl p-3 sm:p-4 border`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${hasPending ? 'text-yellow-900' : 'text-gray-700'}">
                            Pending Amount
                          </p>
                          <Clock className={`h-4 w-4 ${hasPending ? 'text-yellow-600' : 'text-gray-500'}`} />
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold ${hasPending ? 'text-yellow-700' : 'text-gray-700'}`}>
                          {formatCurrency(earning.pendingAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Invoice Stats */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Completed</p>
                          <p className="text-sm font-bold text-gray-900">{earning.completedInvoices}</p>
                        </div>
                      </div>

                      {earning.pendingInvoices > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Pending</p>
                            <p className="text-sm font-bold text-gray-900">{earning.pendingInvoices}</p>
                          </div>
                        </div>
                      )}

                      {earning.lastPayoutDate && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Last Payout</p>
                            <p className="text-xs font-semibold text-gray-900">{formatDate(earning.lastPayoutDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsDialog(earning)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {hasPending && (
                        <Button
                          size="sm"
                          onClick={() => openPayoutDialog(earning)}
                          className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Process Payout
                        </Button>
                      )}

                      <div className="ml-auto text-xs text-gray-500">
                        {earning.invoiceIds?.length || 0} invoice{((earning.invoiceIds?.length || 0) !== 1) ? 's' : ''} pending
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <Wallet className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Provider Earnings Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No providers match your search criteria. Try adjusting your filters."
                : "Provider earnings will appear here once service requests are completed and paid."}
            </p>
          </div>
        )}
      </div>

      {/* Recent Payout History */}
      {payoutHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Recent Payouts
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Latest processed payouts
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/payments/distribute/history")}
              className="border-green-200 text-green-700 hover:bg-blue-50"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {payoutHistory.slice(0, 5).map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payout.providerName}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600">
                        {formatDate(payout.processedAt || payout.requestedAt)}
                      </span>
                      <span className="text-xs text-gray-600 capitalize">
                        {payout.method?.replace("_", " ") || "Bank Transfer"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(payout.amount)}
                  </p>
                  <Badge className={`text-xs ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Process Payout</DialogTitle>
            <DialogDescription>
              Send payment to {selectedProvider?.providerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Available Balance
                  </p>
                  <p className="text-2xl font-bold text-blue-900 flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {selectedProvider && parseFloat(selectedProvider.pendingAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payout Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                max={selectedProvider?.pendingAmount}
                className="border-blue-200"
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger id="method" className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-blue-200 shadow-lg">
                  <SelectItem value="bank_transfer" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Bank Transfer</SelectItem>
                  <SelectItem value="upi" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">UPI</SelectItem>
                  <SelectItem value="cheque" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Cheque</SelectItem>
                  <SelectItem value="cash" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="border-blue-200"
                placeholder="Add any notes..."
              />
            </div>

            {selectedProvider?.bankDetails && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Bank Details
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Account:</span> {selectedProvider.bankDetails.accountName}</p>
                  <p><span className="font-medium">Bank:</span> {selectedProvider.bankDetails.bankName}</p>
                  <p><span className="font-medium">A/C:</span> {selectedProvider.bankDetails.accountNumber}</p>
                  <p><span className="font-medium">IFSC:</span> {selectedProvider.bankDetails.ifscCode}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayoutDialog(false)}
              disabled={processingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={processingPayout}
              className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              {processingPayout ? (
                <>
                  <div className="animate-spin text-white rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 text-white w-4 mr-2" />
                  <p className="text-white">Send Payout</p>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Provider Details</DialogTitle>
            <DialogDescription>
              Earnings and payout information for {viewingProvider?.providerName}
            </DialogDescription>
          </DialogHeader>

          {viewingProvider && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-green-200">
                  <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                    Total Earnings
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(viewingProvider.totalEarnings)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                    Paid Amount
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(viewingProvider.paidAmount)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-900 uppercase mb-1">
                    Pending Amount
                  </p>
                  <p className="text-xl font-bold text-yellow-900">
                    {formatCurrency(viewingProvider.pendingAmount)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 uppercase mb-1">
                    Completion Rate
                  </p>
                  <p className="text-xl font-bold text-purple-900">
                    {viewingProvider.completedInvoices + viewingProvider.pendingInvoices > 0
                      ? Math.round((viewingProvider.completedInvoices / (viewingProvider.completedInvoices + viewingProvider.pendingInvoices)) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed Invoices</span>
                  <span className="font-bold text-gray-900">{viewingProvider.completedInvoices}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending Invoices</span>
                  <span className="font-bold text-gray-900">{viewingProvider.pendingInvoices}</span>
                </div>
                {viewingProvider.lastPayoutDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Payout</span>
                    <span className="font-bold text-gray-900">{formatDate(viewingProvider.lastPayoutDate)}</span>
                  </div>
                )}
              </div>

              {viewingProvider.bankDetails && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Bank Details
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name</span>
                      <span className="font-medium text-gray-900">{viewingProvider.bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name</span>
                      <span className="font-medium text-gray-900">{viewingProvider.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number</span>
                      <span className="font-medium text-gray-900">{viewingProvider.bankDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IFSC Code</span>
                      <span className="font-medium text-gray-900">{viewingProvider.bankDetails.ifscCode}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
