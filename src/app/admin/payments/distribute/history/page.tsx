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
import Link from "next/link";
import { toast } from "sonner";

interface Payout {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail?: string;
  providerPhone?: string;
  amount: string;
  status: "pending" | "processing" | "completed" | "failed";
  method: string;
  transactionId?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  invoiceIds?: string[];
  completedInvoices?: number;
}

export default function PayoutHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadPayoutHistory();
  }, []);

  const loadPayoutHistory = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getPayouts({
        limit: 100,
      });

      const data =
        (response as any).data?.payouts || (response as any).data || response;

      const payoutsArray = Array.isArray(data) ? data : data.payouts || [];

      setPayouts(payoutsArray);
    } catch (error: any) {
      console.error("Error loading payout history:", error);
      toast.error("Failed to load payout history");
      setPayouts([]);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMethodLabel = (method: string) => {
    return method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payout.providerEmail &&
        payout.providerEmail
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (payout.transactionId &&
        payout.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || payout.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || payout.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

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
      payout.providerName,
      payout.amount,
      payout.status,
      payout.method,
      payout.transactionId || "N/A",
      payout.requestedAt,
      payout.processedAt || "N/A",
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

  const handleCompletePayout = async (payout: Payout) => {
    try {
      const transactionId = prompt("Enter Transaction ID (optional):");

      await adminApi.completePayout(payout.id, {
        transactionId: transactionId || undefined,
        notes: "Completed by admin",
      });

      toast.success("Payout completed successfully!");
      await loadPayoutHistory();
    } catch (error: any) {
      console.error("Error completing payout:", error);
      toast.error(
        error?.response?.data?.message || "Failed to complete payout",
      );
    }
  };

  const handleFailPayout = async (payout: Payout) => {
    const reason = prompt("Enter failure reason:");

    if (!reason) {
      toast.error("Failure reason is required");
      return;
    }

    try {
      await adminApi.failPayout(payout.id, {
        reason,
        notes: "Failed by admin",
      });

      toast.success("Payout marked as failed");
      await loadPayoutHistory();
    } catch (error: any) {
      console.error("Error failing payout:", error);
      toast.error(
        error?.response?.data?.message || "Failed to mark payout as failed",
      );
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={exportToCSV}
              disabled={filteredPayouts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
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
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-blue-600" />
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
              className="pl-10 border-blue-300 h-12"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-200 shadow-lg">
              <SelectItem value="all" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">All Status</SelectItem>
              <SelectItem value="completed" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Completed</SelectItem>
              <SelectItem value="pending" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Pending</SelectItem>
              <SelectItem value="processing" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Processing</SelectItem>
              <SelectItem value="failed" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-200 shadow-lg">
              <SelectItem value="all" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">All Methods</SelectItem>
              <SelectItem value="bank_transfer" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Bank Transfer</SelectItem>
              <SelectItem value="upi" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">UPI</SelectItem>
              <SelectItem value="cheque" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Cheque</SelectItem>
              <SelectItem value="cash" className="focus:bg-blue-50 focus:text-blue-900 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white hover:data-[state=checked]:bg-blue-500 hover:data-[state=checked]:text-white">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payout List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
        {filteredPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Transaction ID
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                    Requested Date
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-center shrink-0">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {payout.providerName}
                          </p>
                          {payout.providerEmail && (
                            <p className="text-xs text-gray-600">
                              {payout.providerEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(payout.amount)}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        <Badge
                          className={`${getStatusColor(payout.status)} text-xs font-semibold`}
                        >
                          {payout.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm text-gray-700 capitalize">
                        {getMethodLabel(payout.method)}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm font-mono text-gray-700">
                        {payout.transactionId || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">
                        {formatDate(payout.requestedAt)}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setShowDetailsDialog(true);
                          }}
                          className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payout.status === "processing" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompletePayout(payout)}
                              className="text-green-700 hover:text-green-800 hover:bg-green-50"
                              title="Complete Payout"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFailPayout(payout)}
                              className="text-red-700 hover:text-red-800 hover:bg-red-50"
                              title="Fail Payout"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Payout Details</DialogTitle>
            <DialogDescription>
              Complete information for this payout
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              {/* Provider Info */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedPayout.providerName}
                    </p>
                    {selectedPayout.providerEmail && (
                      <p className="text-sm text-gray-600">
                        {selectedPayout.providerEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                    Amount
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(selectedPayout.amount)}
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
            </div>
          )}
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
