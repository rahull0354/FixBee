"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerApi } from "@/lib/api";
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
  X,
  ArrowLeft,
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  requestId: string;
  totalAmount: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  invoiceDate: string;
  paidAt?: string;
  subtotal?: string;
  materialCost?: string;
  laborCost?: string;
  taxAmount?: string;
  taxRate?: string;
  platformFee?: string;
  providerEarning?: string;
  provider?: {
    name: string;
  };
  serviceRequest?: {
    title?: string;
    serviceTitle?: string;
    serviceType?: string;
  };
  lineItems?: any[];
}

type StatusFilter = "all" | "pending" | "paid" | "overdue";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceRequests, setServiceRequests] = useState<Record<string, any>>(
    {},
  );

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

      const response = await customerApi.getMyInvoices();
      const apiData = (response as any).data || response;

      // Fetch service request details for each invoice
      const requestsMap: Record<string, any> = {};
      if (Array.isArray(apiData)) {
        for (const invoice of apiData) {
          if (invoice.requestId && !requestsMap[invoice.requestId]) {
            try {
              const requestResponse = await customerApi.getServiceRequest(
                invoice.requestId,
              );

              // Extract request data from various possible structures
              let requestData = null;
              if ((requestResponse as any).data?.request) {
                requestData = (requestResponse as any).data.request;
              } else if ((requestResponse as any).request) {
                requestData = (requestResponse as any).request;
              } else if ((requestResponse as any).data) {
                requestData = (requestResponse as any).data;
              } else {
                requestData = requestResponse;
              }

              const finalRequestData = requestData?.request || requestData;
              requestsMap[invoice.requestId] = finalRequestData;
            } catch (err) {
              // Silently fail if service request cannot be loaded
            }
          }
        }
      }

      setServiceRequests(requestsMap);
      setInvoices(apiData || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load invoices";
      toast.error(message);
      setInvoices([]);
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
          (
            serviceRequests[invoice.requestId]?.serviceTitle ||
            invoice.serviceRequest?.title ||
            ""
          )
            .toLowerCase()
            .includes(query) ||
          invoice.provider?.name?.toLowerCase().includes(query),
      );
    }

    setFilteredInvoices(filtered);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100">
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments & Invoices</h1>
        <p className="text-gray-600">View and manage your service payments and invoices</p>
      </div>

      {/* Payment Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-sky-50 shrink-0">
                  <CheckCircle className="h-6 w-6 text-sky-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">
                  {invoices.filter((i) => i.status === "paid").length}
                </h3>
              </div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-amber-50 shrink-0">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">
                  {invoices.filter((i) => i.status === "pending").length}
                </h3>
              </div>
              <p className="text-sm text-gray-500">Pending Payments</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-red-50 shrink-0">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">
                  {invoices.filter((i) => i.status === "overdue").length}
                </h3>
              </div>
              <p className="text-sm text-gray-500">Overdue Payments</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-violet-50 shrink-0">
                  <IndianRupee className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">
                  ₹
                  {invoices
                    .reduce((sum, inv) => {
                      // Calculate correct total for each invoice
                      const serviceChargeItem = inv.lineItems?.find(
                        (item: any) => item.itemType === "service",
                      );
                      const materialCostItem = inv.lineItems?.find(
                        (item: any) => item.itemType === "material",
                      );
                      const platformFeeItem = inv.lineItems?.find(
                        (item: any) => item.itemType === "additional_charge",
                      );

                      const serviceCharge = serviceChargeItem
                        ? parseFloat(serviceChargeItem.total)
                        : parseFloat(inv.laborCost || "0") || 0;
                      const materialCost = materialCostItem
                        ? parseFloat(materialCostItem.total)
                        : parseFloat(inv.materialCost || "0") || 0;
                      const platformFee = platformFeeItem
                        ? parseFloat(platformFeeItem.total)
                        : parseFloat(inv.platformFee || "0") || 0;
                      const taxAmount = parseFloat(inv.taxAmount || "0") || 0;

                      return (
                        sum +
                        serviceCharge +
                        materialCost +
                        platformFee +
                        taxAmount
                      );
                    }, 0)
                    .toFixed(2)}
                </h3>
              </div>
              <p className="text-sm text-gray-500">Total Amount</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by invoice number, service title, or provider name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 border-sky-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-48 border-sky-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-sky-200 shadow-lg">
                  {statusFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== "all" || searchQuery.trim()) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 h-12"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Invoice List */}
          {filteredInvoices.length > 0 ? (
            <div className="space-y-6">
              {filteredInvoices.map((invoice) => {
                // Calculate correct total from invoice components
                const serviceChargeItem = invoice.lineItems?.find(
                  (item: any) => item.itemType === "service",
                );
                const materialCostItem = invoice.lineItems?.find(
                  (item: any) => item.itemType === "material",
                );
                const platformFeeItem = invoice.lineItems?.find(
                  (item: any) => item.itemType === "additional_charge",
                );

                const serviceCharge = serviceChargeItem
                  ? parseFloat(serviceChargeItem.total)
                  : parseFloat(invoice.laborCost || "0") || 0;
                const materialCost = materialCostItem
                  ? parseFloat(materialCostItem.total)
                  : parseFloat(invoice.materialCost || "0") || 0;
                const platformFee = platformFeeItem
                  ? parseFloat(platformFeeItem.total)
                  : parseFloat(invoice.platformFee || "0") || 0;
                const taxAmount = parseFloat(invoice.taxAmount || "0") || 0;

                // Calculate correct total
                const calculatedTotal =
                  serviceCharge + materialCost + platformFee + taxAmount;

                // Get the full service request data (fetched separately)
                const fullServiceRequest = serviceRequests[invoice.requestId];

                // Get service title using the same logic as invoice detail page
                const serviceTitle =
                  fullServiceRequest?.serviceTitle ||
                  invoice.serviceRequest?.title ||
                  "Service Request";
                const serviceType =
                  fullServiceRequest?.serviceType ||
                  invoice.serviceRequest?.serviceType ||
                  "General Service";

                return (
                  <div
                    key={invoice.id}
                    className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 hover:-translate-y-1 hover:shadow-2xl transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      {/* Left Section - Invoice Details */}
                      <div className="flex-1 space-y-3">
                        {/* Invoice Number & Status */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-sky-600 font-semibold">
                            <FileText className="h-5 w-5" />
                            <span className="text-base">
                              {invoice.invoiceNumber}
                            </span>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>

                        {/* Service Title */}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {serviceTitle}
                          </h3>
                          <p className="text-sm text-gray-600">{serviceType}</p>
                        </div>

                        {/* Provider & Date */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {invoice.provider && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{invoice.provider.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(invoice.invoiceDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Amount & Actions */}
                      <div className="flex flex-col md:items-end gap-4">
                        {/* Amount */}
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                          <IndianRupee className="h-6 w-6" />
                          <span>{calculatedTotal.toFixed(2)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/customer/payments/invoices/${invoice.id}`,
                              )
                            }
                            className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
                          >
                            View Invoice
                          </Button>
                          {invoice.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/customer/payments/checkout/${invoice.id}`,
                                )
                              }
                              className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
          )}
        </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="flex-1 h-12" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>

      {/* Invoice Cards Skeleton */}
      <div className="space-y-6">
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
    <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-100 rounded-full mb-6">
        <FileText className="h-10 w-10 text-sky-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No invoices found"
          : "No payments yet"}
      </h3>
      <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} payments`
            : "Your completed service invoices will appear here once providers complete services"}
      </p>
      {statusFilter !== "all" && (
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/customer/requests")}
          className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
        >
          View All Requests
        </Button>
      )}
    </div>
  );
}
