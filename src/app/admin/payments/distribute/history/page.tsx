"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  ArrowLeft,
  Search,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Eye,
  IndianRupee,
  Check,
  X,
  RefreshCcw,
  MoreVertical,
  Play,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";

interface Payout {
  id: string;
  providerId: string;
  providerName?: string;
  providerEmail?: string;
  providerPhone?: string;
  amount?: string;
  totalAmount?: string;
  status: "pending" | "processing" | "completed" | "failed";
  method?: string;
  transactionId?: string;
  notes?: string;
  requestedAt?: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
  initiatedAt?: string;
  completedAt?: string;
  provider?: {
    name: string;
    email?: string;
    phone?: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  invoiceIds?: string[];
  invoiceAmount?: string;
  utr?: string;
  processedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  completedInvoices?: number;
}

export default function PayoutHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [completingPayout, setCompletingPayout] = useState<string | null>(null);
  const [failingPayout, setFailingPayout] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Action modals
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [processNotes, setProcessNotes] = useState("");
  const [completeTransactionId, setCompleteTransactionId] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [failReason, setFailReason] = useState("");
  const [failNotes, setFailNotes] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadPayoutHistory();
  }, [currentPage]);

  const loadPayoutHistory = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getPayouts({
        limit: 1000, // Fetch all data at once
      });

      const data =
        (response as any).data?.payouts || (response as any).data || response;

      const payoutsArray = Array.isArray(data) ? data : data.payouts || [];

      setPayouts(payoutsArray);
      setTotalItems(payoutsArray.length);
    } catch (error: any) {
      console.error("Error loading payout history:", error);
      toast.error("Failed to load payout history");
      setPayouts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
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
    if (!dateString || dateString === "undefined" || dateString === "null")
      return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "N/A";
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-violet-600 animate-pulse" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMethodLabel = (method: string | undefined) => {
    if (!method) return "Bank Transfer";
    return method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter payouts based on search and filters
  const filteredPayouts = payouts.filter((payout) => {
    const providerName = payout.provider?.name || payout.providerName || "";
    const providerEmail = payout.provider?.email || payout.providerEmail || "";
    const transactionId = payout.transactionId || "";

    const matchesSearch =
      searchQuery === "" ||
      providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      providerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transactionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payout.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || payout.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate paginated items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayouts = filteredPayouts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Calculate total pages based on filtered results
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, methodFilter]);

  // Calculate pagination values (must come after totalPages is calculated)
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of list
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Provider Name",
      "Amount",
      "Status",
      "Method",
      "Transaction ID",
      "Requested Date",
      "Processed Date",
    ];
    const rows = filteredPayouts.map((payout) => [
      payout.provider?.name || payout.providerName || "Unknown",
      payout.totalAmount || payout.amount || "0",
      payout.status,
      payout.method || "Bank Transfer",
      payout.transactionId || "N/A",
      formatDate(payout.requestedAt || payout.initiatedAt),
      formatDate(payout.processedAt || payout.completedAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payout-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Payout history exported successfully");
  };

  const handleCompletePayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setCompleteTransactionId("");
    setCompleteNotes("Completed by admin");
    setShowCompleteDialog(true);
  };

  const confirmCompletePayout = async () => {
    if (!selectedPayout) return;

    if (!completeTransactionId.trim()) {
      toast.error("Transaction ID / UTR is required");
      return;
    }

    try {
      setCompletingPayout(selectedPayout.id);
      await adminApi.completePayout(selectedPayout.id, {
        utr: completeTransactionId,
        notes: completeNotes || "Completed by admin",
      });

      toast.success("Payout completed successfully!");
      setShowCompleteDialog(false);
      await loadPayoutHistory();
    } catch (error: any) {
      console.error("Error completing payout:", error);
      toast.error(
        error?.response?.data?.message || "Failed to complete payout",
      );
    } finally {
      setCompletingPayout(null);
    }
  };

  const handleFailPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setFailReason("");
    setFailNotes("Failed by admin");
    setShowFailDialog(true);
  };

  const confirmFailPayout = async () => {
    if (!selectedPayout) return;

    if (!failReason || !failReason.trim()) {
      toast.error("Failure reason is required");
      return;
    }

    try {
      setFailingPayout(selectedPayout.id);
      const payload = {
        failureReason: failReason.trim(),
        notes: failNotes?.trim() || "Failed by admin",
      };

      const response = await adminApi.failPayout(selectedPayout.id, payload);

      toast.success("Payout marked as failed");
      setShowFailDialog(false);
      await loadPayoutHistory();
    } catch (error: any) {
      console.error("Error failing payout:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark payout as failed",
      );
    } finally {
      setFailingPayout(null);
    }
  };

  const handleProcessPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setProcessNotes("");
    setShowProcessDialog(true);
  };

  const confirmProcessPayout = async () => {
    if (!selectedPayout) return;

    try {
      setProcessingPayout(selectedPayout.id);
      await adminApi.processPayout(selectedPayout.id, {
        notes: processNotes || "Processing initiated by admin",
      });

      toast.success("Payout marked as processing!");
      setShowProcessDialog(false);
      await loadPayoutHistory();
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast.error(error?.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessingPayout(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/payments/distribute"
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payouts
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Payout History
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Complete record of all provider payouts
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50 w-full sm:w-auto justify-center"
              onClick={exportToCSV}
              disabled={filteredPayouts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              className="bg-linear-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white w-full sm:w-auto justify-center"
              onClick={loadPayoutHistory}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">
                Total Payouts
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {payouts.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">
                Completed
              </p>
              <p className="text-2xl font-bold text-green-700">
                {payouts.filter((p) => p.status === "completed").length}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-700">
                {payouts.filter((p) => p.status === "pending").length}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">
                Failed
              </p>
              <p className="text-2xl font-bold text-red-700">
                {payouts.filter((p) => p.status === "failed").length}
              </p>
            </div>
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by provider, transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-violet-300 h-12"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-violet-200 shadow-lg">
              <SelectItem
                value="all"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                All Status
              </SelectItem>
              <SelectItem
                value="completed"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Completed
              </SelectItem>
              <SelectItem
                value="pending"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Pending
              </SelectItem>
              <SelectItem
                value="processing"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Processing
              </SelectItem>
              <SelectItem
                value="failed"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Failed
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-48 border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-violet-200 shadow-lg">
              <SelectItem
                value="all"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                All Methods
              </SelectItem>
              <SelectItem
                value="bank_transfer"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Bank Transfer
              </SelectItem>
              <SelectItem
                value="upi"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                UPI
              </SelectItem>
              <SelectItem
                value="cheque"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Cheque
              </SelectItem>
              <SelectItem
                value="cash"
                className="focus:bg-violet-50 focus:text-violet-900 data-[state=checked]:bg-violet-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-violet-500 hover:data-[state=checked]:text-white"
              >
                Cash
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payout List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 overflow-hidden">
        {currentPayouts.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-linear-to-r from-violet-50 to-indigo-50 border-b-2 border-violet-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Requested Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-violet-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3 min-w-50">
                          <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center justify-center shrink-0">
                            <Building className="h-6 w-6 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {payout.provider?.name ||
                                payout.providerName ||
                                "Provider"}
                            </p>
                            {payout.provider?.email || payout.providerEmail ? (
                              <p className="text-xs text-gray-600 truncate">
                                {payout.provider?.email || payout.providerEmail}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <p className="font-bold text-gray-900 text-base">
                          {formatCurrency(payout.totalAmount || payout.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <Badge
                            className={`${getStatusColor(payout.status)} text-xs font-semibold`}
                          >
                            {payout.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <p className="text-sm text-gray-700 capitalize">
                          {getMethodLabel(payout.method)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle hidden lg:table-cell">
                        <p className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">
                          {payout.transactionId || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle hidden lg:table-cell">
                        <p className="text-sm text-gray-700 font-medium">
                          {formatDate(payout.requestedAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowDetailsDialog(true);
                            }}
                            className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {payout.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayout(payout)}
                              disabled={processingPayout === payout.id}
                              className="bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white shadow-sm"
                            >
                              {processingPayout === payout.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Processing
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Process
                                </>
                              )}
                            </Button>
                          )}

                          {payout.status === "processing" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-violet-200 hover:bg-violet-50 h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white border-2 border-violet-200 shadow-lg"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleCompletePayout(payout)}
                                  disabled={completingPayout === payout.id || failingPayout === payout.id}
                                  className="text-gray-700 focus:text-violet-700 focus:bg-violet-50 cursor-pointer"
                                >
                                  <Check className="h-4 w-4 mr-2 text-violet-600" />
                                  {completingPayout === payout.id ? "Completing..." : "Mark as Complete"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-violet-100" />
                                <DropdownMenuItem
                                  onClick={() => handleFailPayout(payout)}
                                  disabled={failingPayout === payout.id || completingPayout === payout.id}
                                  className="text-gray-700 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                >
                                  <X className="h-4 w-4 mr-2 text-red-600" />
                                  {failingPayout === payout.id ? "Failing..." : "Mark as Failed"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4 p-4">
              {currentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="bg-white border-2 border-violet-100 rounded-xl p-4 space-y-3"
                >
                  {/* Provider Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center justify-center shrink-0">
                      <Building className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {payout.provider?.name ||
                          payout.providerName ||
                          "Provider"}
                      </p>
                      {payout.provider?.email || payout.providerEmail ? (
                        <p className="text-xs text-gray-600 truncate">
                          {payout.provider?.email || payout.providerEmail}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusIcon(payout.status)}
                      <Badge
                        className={`${getStatusColor(payout.status)} text-xs font-semibold`}
                      >
                        {payout.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Amount and Date */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Amount
                      </p>
                      <p className="font-bold text-lg text-gray-900">
                        {formatCurrency(payout.totalAmount || payout.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 font-medium">
                        Requested
                      </p>
                      <p className="text-xs text-gray-700">
                        {formatDate(payout.requestedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Method and Transaction */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Method</p>
                      <p className="text-gray-900 capitalize">
                        {getMethodLabel(payout.method)}
                      </p>
                    </div>
                    {payout.transactionId && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Transaction</p>
                        <p className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">
                          {payout.transactionId}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowDetailsDialog(true);
                      }}
                      className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    {payout.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessPayout(payout)}
                        className="flex-1 bg-linear-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Process
                      </Button>
                    )}

                    {payout.status === "processing" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-50"
                          >
                            Actions
                            <MoreVertical className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-white border-2 border-violet-200 shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleCompletePayout(payout)}
                            className="text-gray-700 focus:text-violet-700 focus:bg-violet-50 cursor-pointer"
                          >
                            <Check className="h-4 w-4 mr-2 text-violet-600" />
                            Mark as Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-violet-100" />
                          <DropdownMenuItem
                            onClick={() => handleFailPayout(payout)}
                            className="text-gray-700 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                          >
                            <X className="h-4 w-4 mr-2 text-red-600" />
                            Mark as Failed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full mb-4">
              <Calendar className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Payouts Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all" || methodFilter !== "all"
                ? "No payouts match your search criteria. Try adjusting your filters."
                : "Payout history will appear here once you start processing provider payouts."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPayouts.length > itemsPerPage && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Info */}
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {indexOfFirstItem + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(indexOfLastItem, filteredPayouts.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {filteredPayouts.length}
              </span>{" "}
              payouts
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and adjacent pages
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis for gaps
                      const prevPage = page - 1;
                      const nextPage = page + 1;
                      if (
                        (prevPage === currentPage - 2 && prevPage > 1) ||
                        (nextPage === currentPage + 2 && nextPage < totalPages)
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-2 py-1 text-gray-400 text-sm"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "h-8 w-8 p-0 bg-linear-to-r from-sky-500 to-fuchsia-600 text-white text-sm font-semibold"
                            : "h-8 w-8 p-0 border-violet-200 text-violet-700 hover:bg-violet-50 text-sm font-semibold"
                        }
                      >
                        {page}
                      </Button>
                    );
                  },
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg bg-white border-2 border-violet-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Payout Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information for this payout
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              {/* Provider Info */}
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">
                      {selectedPayout.provider?.name ||
                        selectedPayout.providerName ||
                        "Provider"}
                    </p>
                    {selectedPayout.provider?.email ||
                    selectedPayout.providerEmail ? (
                      <p className="text-sm text-gray-600">
                        {selectedPayout.provider?.email ||
                          selectedPayout.providerEmail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                  <p className="text-xs font-semibold text-violet-900 uppercase mb-1">
                    Payout Amount
                  </p>
                  <p className="text-2xl font-bold text-violet-900">
                    {formatCurrency(
                      selectedPayout.totalAmount || selectedPayout.amount,
                    )}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-4 border ${getStatusColor(selectedPayout.status)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(selectedPayout.status)}
                    <p className="text-xs font-semibold uppercase">Status</p>
                  </div>
                  <p className="text-lg font-bold capitalize">
                    {selectedPayout.status}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {getMethodLabel(selectedPayout.method)}
                  </span>
                </div>
                {selectedPayout.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Transaction ID
                    </span>
                    <span className="font-mono font-semibold text-gray-900">
                      {selectedPayout.transactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Requested On</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(selectedPayout.requestedAt)}
                  </span>
                </div>
                {selectedPayout.processedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Processed On</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(selectedPayout.processedAt)}
                    </span>
                  </div>
                )}
                {selectedPayout.failedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Failed On</span>
                    <span className="font-semibold text-red-700">
                      {formatDate(selectedPayout.failedAt)}
                    </span>
                  </div>
                )}
                {selectedPayout.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-900">
                      {selectedPayout.notes}
                    </p>
                  </div>
                )}
                {selectedPayout.failureReason && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-700 mb-1 font-semibold">
                      Failure Reason
                    </p>
                    <p className="text-sm text-red-900">
                      {selectedPayout.failureReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Bank Details */}
              {selectedPayout.bankDetails && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Bank Details
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name</span>
                      <span className="font-medium text-gray-900">
                        {selectedPayout.bankDetails.accountName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name</span>
                      <span className="font-medium text-gray-900">
                        {selectedPayout.bankDetails.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number</span>
                      <span className="font-medium text-gray-900">
                        {selectedPayout.bankDetails.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IFSC Code</span>
                      <span className="font-medium text-gray-900">
                        {selectedPayout.bankDetails.ifscCode}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Count */}
              {selectedPayout.completedInvoices && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Invoices in this payout
                  </span>
                  <span className="font-bold text-gray-900">
                    {selectedPayout.completedInvoices}
                  </span>
                </div>
              )}

              {/* Status Progress Indicator */}
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-200">
                <p className="text-xs font-semibold text-violet-900 uppercase mb-3">
                  Payout Progress
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedPayout.status === "pending" ||
                        selectedPayout.status === "processing" ||
                        selectedPayout.status === "completed"
                          ? "bg-violet-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>
                    <p className="text-xs mt-1 text-gray-700 font-medium">
                      Pending
                    </p>
                  </div>
                  <div
                    className={`h-0.5 w-8 ${selectedPayout.status !== "pending" ? "bg-violet-500" : "bg-gray-300"}`}
                  ></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedPayout.status === "processing" ||
                        selectedPayout.status === "completed"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </div>
                    <p className="text-xs mt-1 text-gray-700 font-medium">
                      Processing
                    </p>
                  </div>
                  <div
                    className={`h-0.5 w-8 ${selectedPayout.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedPayout.status === "completed"
                          ? "bg-green-500 text-white"
                          : selectedPayout.status === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {selectedPayout.status === "failed" ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-gray-700 font-medium">
                      {selectedPayout.status === "failed"
                        ? "Failed"
                        : "Completed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-3 border-t border-gray-200 pt-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedPayout?.status === "pending" && (
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleProcessPayout(selectedPayout);
                  }}
                  disabled={processingPayout === selectedPayout.id}
                  className="bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white w-full sm:w-auto shadow-md"
                >
                  {processingPayout === selectedPayout.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  )}
                </Button>
              )}
              {selectedPayout?.status === "processing" && (
                <>
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleCompletePayout(selectedPayout);
                    }}
                    disabled={completingPayout === selectedPayout.id}
                    className="bg-linear-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white w-full sm:w-auto shadow-md"
                  >
                    {completingPayout === selectedPayout.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleFailPayout(selectedPayout);
                    }}
                    disabled={failingPayout === selectedPayout.id}
                    variant="destructive"
                    className="w-full sm:w-auto shadow-md"
                  >
                    {failingPayout === selectedPayout.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Failing...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Mark Failed
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              className="w-full sm:w-auto border-violet-200 hover:bg-violet-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-violet-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Start Processing Payout
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Initiate processing for{" "}
              <span className="font-bold text-violet-600">
                {selectedPayout?.providerName || "Provider"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payout Summary */}
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payout Amount</span>
                <span className="font-bold text-lg text-violet-700">
                  {formatCurrency(
                    selectedPayout?.totalAmount || selectedPayout?.amount,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Requested On</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedPayout?.requestedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                  {selectedPayout?.status}
                </Badge>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
              <p className="text-sm text-violet-900">
                This will mark the payout as{" "}
                <span className="font-bold">"Processing"</span> and allow you to
                complete or fail it later.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="process-notes"
                className="text-sm font-semibold text-gray-700"
              >
                Processing Notes{" "}
                <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="process-notes"
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                placeholder="Add any notes about this payout processing..."
                className="w-full min-h-25 px-3 py-2 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              className="flex-1 border-violet-200 hover:bg-violet-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmProcessPayout}
              disabled={processingPayout === selectedPayout?.id}
              className="flex-1 bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white"
            >
              {processingPayout === selectedPayout?.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Payout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-violet-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Complete Payout
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Confirm payout completion for{" "}
              <span className="font-bold text-violet-600">
                {selectedPayout?.providerName || "Provider"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payout Summary */}
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payout Amount</span>
                <span className="font-bold text-lg text-violet-700">
                  {formatCurrency(
                    selectedPayout?.totalAmount || selectedPayout?.amount,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Requested On</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedPayout?.requestedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-xs font-semibold">
                  {selectedPayout?.status}
                </Badge>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-900">
                This will mark the payout as{" "}
                <span className="font-bold">"Completed"</span>. Make sure you
                have actually transferred the funds to the provider.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="transaction-id"
                className="text-sm font-semibold text-gray-700"
              >
                Transaction ID / UTR <span className="text-red-500">*</span>
              </label>
              <Input
                id="transaction-id"
                value={completeTransactionId}
                onChange={(e) => setCompleteTransactionId(e.target.value)}
                placeholder="Enter bank reference number or UTR"
                required
                className="border-violet-300 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="complete-notes"
                className="text-sm font-semibold text-gray-700"
              >
                Notes <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="complete-notes"
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="Add any completion notes..."
                className="w-full min-h-20 px-3 py-2 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              className="flex-1 border-violet-200 hover:bg-violet-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCompletePayout}
              disabled={completingPayout === selectedPayout?.id}
              className="flex-1 bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 text-white"
            >
              {completingPayout === selectedPayout?.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail Payout Dialog */}
      <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-red-200 w-[95vw]">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-gray-900">
                  Fail Payout
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Confirm payout failure for{" "}
                  <span className="font-bold text-red-600">
                    {selectedPayout?.provider?.name ||
                      selectedPayout?.providerName ||
                      "Provider"}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Payout Summary */}
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-violet-900">
                  Payout Amount
                </span>
                <span className="font-bold text-xl text-violet-700">
                  {formatCurrency(
                    selectedPayout?.totalAmount || selectedPayout?.amount,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-violet-900">
                  Requested On
                </span>
                <span className="font-semibold text-violet-700">
                  {formatDate(selectedPayout?.requestedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-900">Current Status</span>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs font-semibold">
                  {selectedPayout?.status}
                </Badge>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    Important Warning
                  </p>
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    This action will mark the payout as{" "}
                    <span className="font-bold">"Failed"</span>. The provider
                    will need to request a new payout and this action cannot be
                    undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Failure Reason */}
            <div className="space-y-2">
              <label
                htmlFor="fail-reason"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <span>Failure Reason</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="fail-reason"
                value={failReason}
                onChange={(e) => {
                  setFailReason(e.target.value);
                }}
                placeholder="Explain why this payout failed (e.g., insufficient funds, incorrect bank details, payment rejected...)"
                required
                className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 resize-none bg-white text-sm placeholder:text-gray-400 transition-all"
              />
              <p className="text-xs text-gray-500">
                Please provide a clear reason for the payout failure
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label
                htmlFor="fail-notes"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <span>Additional Notes</span>
                <span className="text-gray-400 text-xs font-normal">
                  (Optional)
                </span>
              </label>
              <textarea
                id="fail-notes"
                value={failNotes}
                onChange={(e) => {
                  setFailNotes(e.target.value);
                }}
                placeholder="Add any additional notes or context..."
                className="w-full min-h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-violet-500 resize-none bg-white text-sm placeholder:text-gray-400 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setShowFailDialog(false)}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-11 font-semibold"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={confirmFailPayout}
              disabled={failingPayout === selectedPayout?.id}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {failingPayout === selectedPayout?.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Failing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Failure
                </>
              )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
