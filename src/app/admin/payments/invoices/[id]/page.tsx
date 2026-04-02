"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  ArrowLeft,
  FileText,
  Calendar,
  IndianRupee,
  User,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  Share2,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    name: string;
    id: string;
    email?: string;
    phone?: string;
  };
  customer?: {
    name: string;
    id: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  serviceRequest?: {
    title?: string;
    serviceType?: string;
    description?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  lineItems?: any[];
  paymentMethod?: string;
  paymentId?: string;
}

export default function AdminInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInvoice(invoiceId);
      const invoiceData = (response as any).data || response;
      setInvoice(invoiceData);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load invoice";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.info("PDF download feature coming soon!");
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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

  if (!invoice) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-red-200 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Invoice Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The invoice you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/payments/invoices")}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Invoice ID: {invoice.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
            <div className="bg-linear-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Invoice Details</h2>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Track and manage invoice status
                  </p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">
                      Invoice Date
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">
                      Due Date
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.paidAt && (
                  <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-800">
                        Paid Date
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(invoice.paidAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Customer</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.customer?.name || "N/A"}
                      </p>
                    </div>
                    {invoice.customer?.email && (
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-700">
                          {invoice.customer.email}
                        </p>
                      </div>
                    )}
                    {invoice.customer?.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-700">
                          {invoice.customer.phone}
                        </p>
                      </div>
                    )}
                    {invoice.customer?.address && (
                      <div>
                        <p className="text-xs text-gray-500">Service Address</p>
                        <p className="text-sm text-gray-700">
                          {[
                            invoice.customer.address.street,
                            invoice.customer.address.city,
                            invoice.customer.address.state,
                            invoice.customer.address.zipCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Service Provider
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.serviceProvider?.name || "N/A"}
                      </p>
                    </div>
                    {invoice.serviceProvider?.email && (
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-700">
                          {invoice.serviceProvider.email}
                        </p>
                      </div>
                    )}
                    {invoice.serviceProvider?.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-700">
                          {invoice.serviceProvider.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Details */}
              {invoice.serviceRequest && (
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Service Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Service Title</p>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.serviceRequest.title || "N/A"}
                      </p>
                    </div>
                    {invoice.serviceRequest.serviceType && (
                      <div>
                        <p className="text-xs text-gray-500">Service Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.serviceRequest.serviceType}
                        </p>
                      </div>
                    )}
                    {invoice.serviceRequest.description && (
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm text-gray-700">
                          {invoice.serviceRequest.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items / Cost Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Payment Breakdown
            </h3>

            <div className="space-y-3">
              {/* Labor/Service Cost */}
              {invoice.laborCost && (
                <div className="flex items-center justify-between p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Service Charge</p>
                      <p className="text-xs text-gray-600">Labor cost for service</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.laborCost)}
                  </p>
                </div>
              )}

              {/* Material Cost */}
              {invoice.materialCost &&
                parseFloat(invoice.materialCost) > 0 && (
                  <div className="flex items-center justify-between p-4 bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Material Cost
                        </p>
                        <p className="text-xs text-gray-600">
                          Additional materials
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(invoice.materialCost)}
                    </p>
                  </div>
                )}

              {/* Tax Amount */}
              {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex items-center justify-between p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Tax</p>
                      <p className="text-xs text-gray-600">
                        {invoice.taxRate || "N/A"} tax rate
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.taxAmount)}
                  </p>
                </div>
              )}

              {/* Platform Fee */}
              {invoice.platformFee &&
                parseFloat(invoice.platformFee) > 0 && (
                  <div className="flex items-center justify-between p-4 bg-linear-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Platform Fee
                        </p>
                        <p className="text-xs text-gray-600">Service charge</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(invoice.platformFee)}
                    </p>
                  </div>
                )}

              {/* Total */}
              <div className="flex items-center justify-between p-6 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl border-2 border-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Total Amount</p>
                    <p className="text-sm text-blue-100">
                      Including all charges
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>

              {/* Provider Earning */}
              {invoice.providerEarning && (
                <div className="flex items-center justify-between p-4 bg-linear-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Provider Earning
                      </p>
                      <p className="text-xs text-gray-600">
                        After platform fee deduction
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(invoice.providerEarning)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Payment Info */}
        <div className="space-y-6">
          {/* Payment Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Payment Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(invoice.status)}
              </div>

              {invoice.paymentMethod && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {invoice.paymentMethod}
                  </p>
                </div>
              )}

              {invoice.paymentId && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="text-xs text-gray-700 font-mono">
                    {invoice.paymentId}
                  </p>
                </div>
              )}

              {invoice.paidAt && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Paid On</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() =>
                  router.push(`/admin/providers/${invoice.serviceProvider?.id}`)
                }
              >
                <Briefcase className="h-4 w-4 mr-2" />
                View Provider Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() =>
                  router.push(`/admin/customers/${invoice.customer?.id}`)
                }
              >
                <User className="h-4 w-4 mr-2" />
                View Customer Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() =>
                  router.push(`/admin/requests/${invoice.requestId}`)
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                View Service Request
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
