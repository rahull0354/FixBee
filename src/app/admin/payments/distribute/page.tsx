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
  FileText,
  Smartphone,
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
  totalAmount?: string;
  status: "pending" | "processing" | "completed" | "failed";
  method: string;
  transactionId?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  initiatedAt?: string;
  failedAt?: string;
  failureReason?: string;
  provider?: {
    name: string;
    email?: string;
    phone?: string;
  };
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

  // Payout Dialog States
  const [selectedProvider, setSelectedProvider] = useState<ProviderEarning | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("bank_transfer");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  // Prepare Payout States
  const [showPrepareDialog, setShowPrepareDialog] = useState(false);
  const [prepareData, setPrepareData] = useState<any>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [selectedUpiId, setSelectedUpiId] = useState<string>("");
  const [loadingPrepare, setLoadingPrepare] = useState(false);

  // Process Payout States
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [currentPayoutId, setCurrentPayoutId] = useState<string>("");
  const [processPayoutData, setProcessPayoutData] = useState<any>(null);

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
        console.log("📜 First payout item:", historyArray[0]);
        if (historyArray[0]) {
          console.log("📜 Payout fields:", Object.keys(historyArray[0]));
          console.log("📜 Payout amount:", historyArray[0].amount);
          console.log("📜 Payout status:", historyArray[0].status);
          console.log("📜 Payout processedAt:", historyArray[0].processedAt);
          console.log("📜 Payout requestedAt:", historyArray[0].requestedAt);
        }

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

  // Step 1: Open Prepare Payout Dialog
  const openPreparePayoutDialog = async (provider: ProviderEarning) => {
    setSelectedProvider(provider);
    setPayoutAmount(provider.pendingAmount);
    setShowPayoutDialog(false); // Close the old dialog
    setShowPrepareDialog(true);

    try {
      setLoadingPrepare(true);
      const response = await adminApi.preparePayout(provider.providerId);
      const data = (response as any).data || response;

      console.log('===== PREPARE PAYOUT API RESPONSE =====');
      console.log('Full Response JSON:', JSON.stringify(data, null, 2));
      console.log('Response Type:', typeof data);
      console.log('Is Array?', Array.isArray(data));
      console.log('Has data property?', 'data' in (response as any));
      console.log('Top-level keys:', Object.keys(data || {}));

      // Check paymentDetails specifically
      console.log('\n🔍 Checking paymentDetails:');
      console.log('data.paymentDetails:', data?.paymentDetails);
      console.log('data.paymentDetails keys:', data?.paymentDetails ? Object.keys(data.paymentDetails) : 'N/A');

      if (data?.paymentDetails) {
        console.log('paymentDetails.bankAccounts:', data.paymentDetails.bankAccounts);
        console.log('paymentDetails.bankDetails:', data.paymentDetails.bankDetails);
        console.log('paymentDetails.upiIds:', data.paymentDetails.upiIds);
        console.log('paymentDetails.upiDetails:', data.paymentDetails.upiDetails);
      }

      console.log('=======================================');

      // Extract bank accounts from paymentDetails
      let bankAccountsList: any[] = [];
      let upiIdsList: any[] = [];

      // Try to get from options arrays first
      if (data?.paymentDetails?.bankTransferOptions && data.paymentDetails.bankTransferOptions.length > 0) {
        bankAccountsList = data.paymentDetails.bankTransferOptions;
      }

      if (data?.paymentDetails?.upiOptions && data.paymentDetails.upiOptions.length > 0) {
        upiIdsList = data.paymentDetails.upiOptions;
      }

      // If options are empty, use primary accounts
      if (bankAccountsList.length === 0 && data?.paymentDetails?.primaryBankAccount) {
        const primaryBank = data.paymentDetails.primaryBankAccount;
        bankAccountsList = [{
          id: primaryBank.id,
          bankAccountId: primaryBank.id,
          bankName: primaryBank.bankName,
          accountNumber: `XXXX-XXXX-XXXX-${primaryBank.accountNumberLast4}`,
          accountNumberLast4: primaryBank.accountNumberLast4,
          accountNumberMasked: `XXXX-XXXX-XXXX-${primaryBank.accountNumberLast4}`,
          ifscCode: primaryBank.ifsc,
          ifsc: primaryBank.ifsc,
          accountHolder: primaryBank.accountHolder,
          isPrimary: true,
        }];
        console.log('Using primary bank account:', bankAccountsList[0]);
      }

      if (upiIdsList.length === 0 && data?.paymentDetails?.primaryUpiId) {
        const primaryUpi = data.paymentDetails.primaryUpiId;
        upiIdsList = [{
          id: primaryUpi.id,
          upiId: primaryUpi.upiId,
          isPrimary: true,
        }];
        console.log('Using primary UPI ID:', upiIdsList[0]);
      }

      console.log('Final Bank Accounts List:', bankAccountsList);
      console.log('Final UPI IDs List:', upiIdsList);

      // Check all possible locations for bank accounts
      console.log('\n🔍 Searching for Bank Accounts:');
      console.log('data.bankAccounts:', data?.bankAccounts);
      console.log('data.bankDetails:', data?.bankDetails);
      console.log('data.provider?.bankAccounts:', data?.provider?.bankAccounts);
      console.log('data.provider?.bankDetails:', data?.provider?.bankDetails);
      console.log('data.payout?.bankAccounts:', data?.payout?.bankAccounts);
      console.log('data.payout?.bankDetails:', data?.payout?.bankDetails);
      console.log('data.paymentDetails?.bankAccounts:', data?.paymentDetails?.bankAccounts);
      console.log('data.paymentDetails?.bankDetails:', data?.paymentDetails?.bankDetails);

      // Check all possible locations for UPI IDs
      console.log('\n🔍 Searching for UPI IDs:');
      console.log('data.upiIds:', data?.upiIds);
      console.log('data.upiDetails:', data?.upiDetails);
      console.log('data.provider?.upiIds:', data?.provider?.upiIds);
      console.log('data.provider?.upiDetails:', data?.provider?.upiDetails);
      console.log('data.payout?.upiIds:', data?.payout?.upiIds);
      console.log('data.payout?.upiDetails:', data?.payout?.upiDetails);
      console.log('data.paymentDetails?.upiIds:', data?.paymentDetails?.upiIds);
      console.log('data.paymentDetails?.upiDetails:', data?.paymentDetails?.upiDetails);

      // Extract data from response, handling different possible structures
      const prepareDataParsed = {
        totalAmount: data?.totalAmount || data?.payout?.totalAmount || provider.pendingAmount,
        invoiceCount: data?.invoiceCount || data?.invoices?.length || data?.payout?.invoices?.length || 0,
        invoices: data?.invoices || data?.payout?.invoices || [],
        bankAccounts: bankAccountsList,
        upiIds: upiIdsList,
        duplicateWarnings: data?.duplicateWarnings || data?.payout?.duplicateWarnings || data?.warnings || [],
        warnings: data?.warnings || data?.payout?.warnings || [],
        hasBankAccount: data?.paymentDetails?.hasBankAccount,
        hasUpiId: data?.paymentDetails?.hasUpiId,
      };

      console.log('\n✅ Parsed Prepare Data:', prepareDataParsed);
      console.log('Bank Accounts Count:', prepareDataParsed.bankAccounts.length);
      console.log('UPI IDs Count:', prepareDataParsed.upiIds.length);

      // Log first invoice structure for debugging
      if (prepareDataParsed.invoices && prepareDataParsed.invoices.length > 0) {
        console.log('First Invoice Structure:', prepareDataParsed.invoices[0]);
      }

      setPrepareData(prepareDataParsed);

      // Auto-select primary bank account
      if (prepareDataParsed.bankAccounts && prepareDataParsed.bankAccounts.length > 0) {
        const primaryBank = prepareDataParsed.bankAccounts.find((acc: any) => acc.isPrimary);
        if (primaryBank) {
          setSelectedBankAccount(primaryBank.id || primaryBank.bankAccountId);
        } else {
          setSelectedBankAccount(prepareDataParsed.bankAccounts[0].id || prepareDataParsed.bankAccounts[0].bankAccountId);
        }
      }

      // Auto-select primary UPI ID
      if (prepareDataParsed.upiIds && prepareDataParsed.upiIds.length > 0) {
        const primaryUpi = prepareDataParsed.upiIds.find((upi: any) => upi.isPrimary);
        if (primaryUpi) {
          setSelectedUpiId(primaryUpi.id || primaryUpi.upiId);
        } else {
          setSelectedUpiId(prepareDataParsed.upiIds[0].id || prepareDataParsed.upiIds[0].upiId);
        }
      }

      // Show warning if no invoices found
      if (prepareDataParsed.invoiceCount === 0 && !prepareDataParsed.warnings?.length) {
        toast.info("No pending invoices found for this provider");
      }
    } catch (error: any) {
      console.error("Error loading prepare data:", error);
      toast.error(error?.response?.data?.message || "Failed to load payout details");
      setShowPrepareDialog(false);
    } finally {
      setLoadingPrepare(false);
    }
  };

  // Step 2: Initiate Payout
  const handleInitiatePayout = async () => {
    if (!selectedProvider) return;

    try {
      setProcessingPayout(true);

      const initiateData: any = {
        amount: parseFloat(payoutAmount),
        notes: payoutNotes,
      };

      // Add bank account if selected
      if (payoutMethod === "bank_transfer" && selectedBankAccount) {
        initiateData.bankAccountId = selectedBankAccount;
      }

      const response = await adminApi.initiatePayout(selectedProvider.providerId, initiateData);
      const payoutData = (response as any).data || response;

      console.log('Initiate Payout Response:', payoutData);

      // Extract payout ID
      const payoutId = payoutData?.payout?.id || payoutData?.payoutId || payoutData?.id || payoutData?.payout?.payoutId;

      if (!payoutId) {
        console.error('Full response structure:', JSON.stringify(payoutData, null, 2));
        throw new Error("Payout initiation failed - no payout ID returned");
      }

      setCurrentPayoutId(payoutId);

      // Store the complete payout data with payment details
      setProcessPayoutData({
        ...payoutData,
        payout: payoutData.payout || payoutData,
        amount: payoutData.payout?.amount || payoutData.amount || payoutAmount,
        provider: selectedProvider,
        bankAccount: prepareData?.bankAccounts?.find((acc: any) => acc.id === selectedBankAccount),
        upiId: prepareData?.upiIds?.find((upi: any) => upi.id === selectedUpiId),
      });

      // Close prepare dialog, open process dialog
      setShowPrepareDialog(false);
      setShowProcessDialog(true);

      toast.success("Payout initiated successfully!");
    } catch (error: any) {
      console.error("Error initiating payout:", error);
      toast.error(error?.response?.data?.message || "Failed to initiate payout");
    } finally {
      setProcessingPayout(false);
    }
  };

  // Step 3: Admin has made payment - Show complete dialog
  const handleMadePayment = () => {
    setShowProcessDialog(false);
    // The complete dialog is in the history page, so we redirect there
    router.push(`/admin/payments/distribute/history`);
  };

  const openPayoutDialog = (provider: ProviderEarning) => {
    setSelectedProvider(provider);
    setPayoutAmount(provider.pendingAmount);
    setPayoutNotes("");
    setPayoutMethod("bank_transfer");
    setShowPayoutDialog(true);
  };


  const openDetailsDialog = (provider: ProviderEarning) => {
    setViewingProvider(provider);
    setShowDetailsDialog(true);
  };

  const formatCurrency = (amount: string | number | undefined | null) => {
    if (!amount || amount === "undefined" || amount === "null") return "₹0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString || dateString === "undefined" || dateString === "null") return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "N/A";
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.warn("Invalid date:", dateString);
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusIconBg = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100";
      case "pending":
        return "bg-yellow-100";
      case "processing":
        return "bg-blue-100";
      case "failed":
        return "bg-red-100";
      default:
        return "bg-gray-100";
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
                          onClick={() => openPreparePayoutDialog(earning)}
                          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Prepare Payout
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
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {payoutHistory.slice(0, 5).map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${getStatusIconBg(payout.status)} flex items-center justify-center border-2 border-gray-200`}>
                    {getStatusIcon(payout.status)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {payout.provider?.name || payout.providerName || "Unknown Provider"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600">
                        {formatDate(payout.processedAt || payout.completedAt || payout.initiatedAt)}
                      </span>
                      <span className="text-xs text-gray-600 capitalize">
                        Bank Transfer
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-base">
                    {formatCurrency(payout.totalAmount)}
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

      {/* Prepare Payout Dialog */}
      <Dialog open={showPrepareDialog} onOpenChange={setShowPrepareDialog}>
        <DialogContent className="sm:max-w-2xl bg-white border-2 border-blue-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Prepare Payout</DialogTitle>
            <DialogDescription className="text-gray-600">
              Review payout details for {selectedProvider?.providerName}
            </DialogDescription>
          </DialogHeader>

          {loadingPrepare ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : prepareData ? (
            <div className="space-y-4 py-4">
              {/* Amount Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Total Amount to Pay</p>
                    <p className="text-3xl font-bold text-blue-900 flex items-center gap-1">
                      <IndianRupee className="h-6 w-6" />
                      {formatCurrency(prepareData.totalAmount || payoutAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">{prepareData.invoiceCount || 0} Invoices</p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              {prepareData.invoices && prepareData.invoices.length > 0 ? (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Invoices Included ({prepareData.invoices.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {prepareData.invoices.map((invoice: any, idx: number) => {
                      // Try multiple possible amount fields - backend returns 'providerEarning'
                      const invoiceAmount = invoice.providerEarning || invoice.amount || invoice.totalAmount || invoice.serviceCharge || invoice.laborCost || invoice.materialCost || 0;

                      return (
                        <div
                          key={invoice.id || invoice.invoiceId || idx}
                          className={`flex items-center justify-between p-2 rounded-lg border ${
                            invoice.isDuplicate
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {invoice.isDuplicate && (
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                Invoice #{idx + 1}
                              </span>
                              {invoice.paidAt && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(invoice.paidAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(invoiceAmount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {prepareData.duplicateWarnings && prepareData.duplicateWarnings.length > 0 && (
                    <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-300">
                      <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Duplicate Warnings</p>
                      <ul className="text-xs text-amber-800 space-y-1">
                        {prepareData.duplicateWarnings.map((warning: string, idx: number) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">No Invoices Found</p>
                      <p className="text-xs text-blue-700">This payout will be created without associated invoices</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-3">
                {/* No payment methods warning */}
                {(!prepareData.bankAccounts || prepareData.bankAccounts.length === 0) &&
                 (!prepareData.upiIds || prepareData.upiIds.length === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-900 font-medium">No payment methods available</p>
                    </div>
                  </div>
                )}

                {/* Payment Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bank Accounts */}
                  {prepareData.bankAccounts && prepareData.bankAccounts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">Bank Account</Label>
                      <div className="space-y-1.5">
                        {prepareData.bankAccounts.map((account: any, idx: number) => (
                          <label
                            key={account.id || account.bankAccountId || idx}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedBankAccount === (account.id || account.bankAccountId) && payoutMethod === "bank_transfer"
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-method"
                              checked={selectedBankAccount === (account.id || account.bankAccountId) && payoutMethod === "bank_transfer"}
                              onChange={() => {
                                setSelectedBankAccount(account.id || account.bankAccountId);
                                setPayoutMethod("bank_transfer");
                              }}
                              className="w-4 h-4 text-blue-600 accent-blue-600 mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-900">
                                  {account.bankName || account.bank}
                                </span>
                                {account.isPrimary && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs text-gray-600">
                                  <span className="text-gray-500">A/C:</span>{" "}
                                  <span className="font-mono font-medium text-gray-800">
                                    {account.accountNumber || account.accountNumberMasked}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-600">
                                  <span className="text-gray-500">IFSC:</span>{" "}
                                  <span className="font-mono font-medium text-gray-800">
                                    {account.ifscCode || account.ifsc}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UPI IDs */}
                  {prepareData.upiIds && prepareData.upiIds.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">UPI ID</Label>
                      <div className="space-y-1.5">
                        {prepareData.upiIds.map((upi: any) => (
                          <label
                            key={upi.id || upi.upiId}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedUpiId === (upi.id || upi.upiId) && payoutMethod === "upi"
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-method"
                              checked={selectedUpiId === (upi.id || upi.upiId) && payoutMethod === "upi"}
                              onChange={() => {
                                setSelectedUpiId(upi.id || upi.upiId);
                                setPayoutMethod("upi");
                              }}
                              className="w-4 h-4 text-blue-600 accent-blue-600 mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-900 font-mono">
                                  {upi.upiId}
                                </span>
                                {upi.isPrimary && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Pay via GPay, PhonePe, Paytm
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="payout-notes">Notes (Optional)</Label>
                <textarea
                  id="payout-notes"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Add any notes about this payout..."
                  className="w-full min-h-20 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPrepareDialog(false)}
              disabled={processingPayout}
              className="border-blue-200 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitiatePayout}
              disabled={processingPayout || loadingPrepare}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
            >
              {processingPayout ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Initiate Payout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Process Payment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete the payment transfer for {selectedProvider?.providerName}
            </DialogDescription>
          </DialogHeader>

          {processPayoutData && (
            <div className="space-y-4 py-4">
              {/* Amount */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-1">Amount to Transfer</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(processPayoutData.amount || processPayoutData.payout?.amount || payoutAmount)}
                </p>
              </div>

              {/* Payment Instructions */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Payment Details</h3>

                {payoutMethod === "bank_transfer" && processPayoutData.bankAccount && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bank</span>
                        <span className="font-semibold text-gray-900">{processPayoutData.bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Account Number</span>
                        <span className="font-mono font-semibold text-gray-900">{processPayoutData.bankAccount.accountNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">IFSC Code</span>
                        <span className="font-mono font-semibold text-gray-900">{processPayoutData.bankAccount.ifscCode}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Account Holder</span>
                        <span className="font-semibold text-gray-900">{processPayoutData.bankAccount.accountHolder}</span>
                      </div>
                    </div>
                  </div>
                )}

                {payoutMethod === "upi" && processPayoutData.upiId && (
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                      <p className="font-mono text-xl font-bold text-blue-900">{processPayoutData.upiId.upiId}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-900 mb-2">Instructions</h3>
                <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>Copy the payment details above</li>
                  <li>Open your banking app or UPI app</li>
                  <li>Transfer the amount shown above</li>
                  <li>Come back and click "I've Made the Payment"</li>
                  <li>Enter the UTR/reference number to complete</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessDialog(false);
                handleMadePayment();
              }}
              className="border-blue-200 hover:bg-blue-50"
            >
              I've Made the Payment
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
