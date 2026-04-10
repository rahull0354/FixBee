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
  provider?: {
    name: string;
    id: string;
    email?: string;
    phone?: string;
  };
  providerId?: string;
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
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
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

      // Load service request details if available
      if (invoiceData.requestId) {
        try {
          // For now, we'll use the serviceRequest data that comes with the invoice
          if (invoiceData.serviceRequest) {
            setServiceRequest(invoiceData.serviceRequest);
          }
        } catch (err) {
          // Continue without service request data
        }
      }

      // Fetch provider details separately to get email and phone
      const providerId =
        invoiceData.serviceProvider?.id ||
        invoiceData.provider?.id ||
        invoiceData.providerId;
      if (providerId) {
        try {
          const providerResponse = await adminApi.getProvider(providerId);
          const providerData =
            (providerResponse as any).data || providerResponse;
          setProviderDetails(providerData);
        } catch (providerErr) {
          // Continue without provider details - use serviceProvider data from invoice
          setProviderDetails(
            invoiceData.serviceProvider || invoiceData.provider,
          );
        }
      }

      // Use customer data from invoice response (no separate endpoint available)
      setCustomerDetails(invoiceData.customer);
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

  const handleDownloadPDF = async () => {
    try {
      if (!invoice) {
        toast.error("Invoice not loaded");
        return;
      }

      toast.info("Generating admin PDF...", { id: "pdf-download" });

      const { downloadInvoicePDF } = await import("@/lib/utils/pdf");
      const { AdminInvoicePDF } =
        await import("@/components/invoice/AdminInvoicePDF");

      await downloadInvoicePDF({
        invoice: {
          ...invoice,
          laborCost: invoice.laborCost,
          materialCost: invoice.materialCost,
          lineItems: invoice.lineItems,
        },
        serviceRequest: invoice.serviceRequest,
        provider: providerDetails || invoice.serviceProvider,
        customer: customerDetails || invoice.customer,
        InvoicePDFComponent: AdminInvoicePDF,
      } as any);

      toast.success("Admin invoice downloaded successfully!", {
        id: "pdf-download",
      });
    } catch (error) {
      toast.error("Failed to download admin invoice. Please try again.", {
        id: "pdf-download",
      });
    }
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
          className="border-violet-200 text-violet-700 hover:bg-violet-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/payments/invoices")}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Invoice ID: {invoice.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-3 lg:order-1">
          {/* Invoice Status Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-100 overflow-hidden">
            <div className="bg-linear-to-r from-violet-500 to-indigo-600 p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    <h2 className="text-lg sm:text-xl font-bold">
                      Invoice Details
                    </h2>
                  </div>
                  <p className="text-violet-100 text-xs sm:text-sm">
                    Track and manage invoice status
                  </p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-violet-600" />
                    <p className="text-[10px] sm:text-xs font-semibold text-violet-800">
                      Invoice Date
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
                <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-violet-600" />
                    <p className="text-[10px] sm:text-xs font-semibold text-violet-800">
                      Due Date
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.paidAt && (
                  <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-xl p-3 sm:p-4 border-2 border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <p className="text-[10px] sm:text-xs font-semibold text-emerald-800">
                        Paid Date
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatDate(invoice.paidAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Customer
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Name
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {invoice.customer?.name || "N/A"}
                      </p>
                    </div>
                    {invoice.customer?.email && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Email
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 break-all">
                          {invoice.customer.email}
                        </p>
                      </div>
                    )}
                    {invoice.customer?.phone && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Phone
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {invoice.customer.phone}
                        </p>
                      </div>
                    )}
                    {invoice.customer?.address && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Service Address
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
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

                <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Service Provider
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Name
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {invoice.serviceProvider?.name || "N/A"}
                      </p>
                    </div>
                    {(providerDetails?.email ||
                      invoice.serviceProvider?.email) && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Email
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 break-all">
                          {providerDetails?.email ||
                            invoice.serviceProvider?.email}
                        </p>
                      </div>
                    )}
                    {(providerDetails?.phone ||
                      invoice.serviceProvider?.phone) && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Phone
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {providerDetails?.phone ||
                            invoice.serviceProvider?.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Details */}
              {invoice.serviceRequest && (
                <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Service Details
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Service Title
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {invoice.serviceRequest.title || "N/A"}
                      </p>
                    </div>
                    {invoice.serviceRequest.serviceType && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Service Type
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {invoice.serviceRequest.serviceType}
                        </p>
                      </div>
                    )}
                    {invoice.serviceRequest.description && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Description
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {invoice.serviceRequest.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Breakdown - Redesigned */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-100 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Earnings Breakdown
              </h3>
              <p className="text-xs sm:text-sm text-violet-100 mt-1">
                Complete payment breakdown
              </p>
            </div>

            <div className="p-4 sm:p-6">
              {/* Bill Header */}
              <div className="bg-linear-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold">
                      Invoice Number
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold">
                      Date
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatDate(invoice.invoiceDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items - Desktop Table */}
              <div className="hidden sm:block border-2 border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-violet-50 to-indigo-50 border-b-2 border-violet-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Labor/Service Cost */}
                    {(() => {
                      const serviceChargeItem = invoice.lineItems?.find(
                        (item: any) => item.itemType === "service",
                      );
                      const serviceCharge = serviceChargeItem
                        ? parseFloat(serviceChargeItem.total)
                        : parseFloat(invoice.laborCost || "0") || 0;

                      return serviceCharge > 0 ? (
                        <tr className="hover:bg-violet-50/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                                <Briefcase className="h-4 w-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  Service Charges
                                </p>
                                <p className="text-xs text-gray-500">
                                  Final charge by provider
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(serviceCharge)}
                            </p>
                          </td>
                        </tr>
                      ) : null;
                    })()}

                    {/* Material Cost */}
                    {invoice.materialCost &&
                      parseFloat(invoice.materialCost) > 0 && (
                        <tr className="hover:bg-violet-50/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                                <Package className="h-4 w-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  Material Charges
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cost of materials used
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(invoice.materialCost)}
                            </p>
                          </td>
                        </tr>
                      )}

                    {/* Subtotal */}
                    {(invoice.laborCost || invoice.materialCost) && (
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-700 text-sm">
                            Subtotal
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(
                              (() => {
                                const serviceChargeItem =
                                  invoice.lineItems?.find(
                                    (item: any) => item.itemType === "service",
                                  );
                                const serviceCharge = serviceChargeItem
                                  ? parseFloat(serviceChargeItem.total)
                                  : parseFloat(invoice.laborCost || "0") || 0;
                                const materialCost =
                                  parseFloat(invoice.materialCost || "0") || 0;
                                return (
                                  serviceCharge + materialCost
                                ).toString();
                              })(),
                            )}
                          </p>
                        </td>
                      </tr>
                    )}

                    {/* Tax Amount */}
                    {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                              <TrendingUp className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                Tax
                              </p>
                              <p className="text-xs text-gray-500">
                                {invoice.taxRate || "N/A"} applicable on service
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(invoice.taxAmount)}
                          </p>
                        </td>
                      </tr>
                    )}

                    {/* Platform Fee */}
                    {invoice.platformFee &&
                      parseFloat(invoice.platformFee) > 0 && (
                        <tr className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                                <Wallet className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  Platform Fee
                                </p>
                                <p className="text-xs text-gray-500">
                                  Service platform charges
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(invoice.platformFee)}
                            </p>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* Line Items - Mobile Cards */}
              <div className="sm:hidden space-y-3 mb-6">
                {/* Labor/Service Cost */}
                {(() => {
                  const serviceChargeItem = invoice.lineItems?.find(
                    (item: any) => item.itemType === "service",
                  );
                  const serviceCharge = serviceChargeItem
                    ? parseFloat(serviceChargeItem.total)
                    : parseFloat(invoice.laborCost || "0") || 0;

                  return serviceCharge > 0 ? (
                    <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl border-2 border-violet-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                            <Briefcase className="h-5 w-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              Service Charges
                            </p>
                            <p className="text-xs text-gray-600">
                              Final charge by provider
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(serviceCharge)}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Material Cost */}
                {invoice.materialCost &&
                  parseFloat(invoice.materialCost) > 0 && (
                    <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl border-2 border-violet-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              Material Charges
                            </p>
                            <p className="text-xs text-gray-600">
                              Cost of materials
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(invoice.materialCost)}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Subtotal */}
                {(invoice.laborCost || invoice.materialCost) && (
                  <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-700 text-sm">
                        Subtotal
                      </p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(
                          (() => {
                            const serviceChargeItem = invoice.lineItems?.find(
                              (item: any) => item.itemType === "service",
                            );
                            const serviceCharge = serviceChargeItem
                              ? parseFloat(serviceChargeItem.total)
                              : parseFloat(invoice.laborCost || "0") || 0;
                            const materialCost =
                              parseFloat(invoice.materialCost || "0") || 0;
                            return (serviceCharge + materialCost).toString();
                          })(),
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tax */}
                {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                  <div className="bg-linear-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Tax</p>
                          <p className="text-xs text-gray-600">
                            {invoice.taxRate || "N/A"} applicable
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.taxAmount)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Platform Fee */}
                {invoice.platformFee && parseFloat(invoice.platformFee) > 0 && (
                  <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                          <Wallet className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            Platform Fee
                          </p>
                          <p className="text-xs text-gray-600">
                            Service charges
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.platformFee)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Amount - Prominent */}
              <div className="bg-linear-to-r from-violet-600 to-indigo-600 rounded-xl border-2 border-violet-700 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                      <IndianRupee className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-violet-100 uppercase tracking-wide">
                        Total Amount
                      </p>
                      <p className="text-[10px] sm:text-xs text-violet-200">
                        Including all taxes and charges
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl sm:text-4xl font-bold text-white">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Payment Info */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Payment Status Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-100 p-4 sm:p-6 order-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
              Payment Information
            </h3>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-600">Status</p>
                {getStatusBadge(invoice.status)}
              </div>

              {invoice.paymentMethod && (
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Payment Method
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 capitalize">
                    {invoice.paymentMethod}
                  </p>
                </div>
              )}

              {invoice.paymentId && (
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-gray-600">Payment ID</p>
                  <p className="text-[10px] sm:text-xs text-gray-700 font-mono break-all">
                    {invoice.paymentId}
                  </p>
                </div>
              )}

              {invoice.paidAt && (
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-gray-600">Paid On</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-200 p-4 sm:p-6 order-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
                onClick={() =>
                  router.push(`/admin/providers/${invoice.serviceProvider?.id}`)
                }
              >
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                View Provider Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
                onClick={() =>
                  router.push(`/admin/customers/${invoice.customer?.id}`)
                }
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                View Customer Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
                onClick={() =>
                  router.push(`/admin/requests/${invoice.requestId}`)
                }
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                View Service Request
              </Button>
            </div>
          </div>

          {/* Earning Distribution */}
          {(invoice.providerEarning || invoice.platformFee) && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-violet-100 p-4 sm:p-6 order-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                Earning Distribution
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {/* Provider Share */}
                {(() => {
                  const serviceChargeItem = invoice.lineItems?.find(
                    (item: any) => item.itemType === "service",
                  );
                  const serviceCharge = serviceChargeItem
                    ? parseFloat(serviceChargeItem.total)
                    : parseFloat(invoice.laborCost || "0") || 0;
                  const materialCost =
                    parseFloat(invoice.materialCost || "0") || 0;

                  // Provider earns: Service Charge + Material Cost
                  const providerEarning = serviceCharge + materialCost;

                  return providerEarning > 0 ? (
                    <div className="bg-linear-to-br from-violet-50 to-indigo-50 rounded-xl border-2 border-violet-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-white" />
                          </div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            Provider
                          </p>
                        </div>
                        <Badge className="bg-violet-100 text-violet-800 text-[10px] sm:text-xs font-semibold">
                          {(
                            (providerEarning /
                              parseFloat(invoice.totalAmount)) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-violet-700">
                        {formatCurrency(providerEarning.toString())}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                        Service + Material charges
                      </p>
                    </div>
                  ) : null;
                })()}

                {/* Admin Share */}
                {invoice.platformFee && parseFloat(invoice.platformFee) > 0 && (
                  <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                          Admin
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-semibold">
                        {(
                          (parseFloat(invoice.platformFee) /
                            parseFloat(invoice.totalAmount)) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-700">
                      {formatCurrency(invoice.platformFee)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                      Platform service fee
                    </p>
                  </div>
                )}

                {/* Total Distribution Bar */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 mb-2">
                    <span>Service</span>
                    <span>Tax</span>
                    <span>Admin</span>
                  </div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    {(() => {
                      const serviceChargeItem = invoice.lineItems?.find(
                        (item: any) => item.itemType === "service",
                      );
                      const serviceCharge = serviceChargeItem
                        ? parseFloat(serviceChargeItem.total)
                        : parseFloat(invoice.laborCost || "0") || 0;
                      const materialCost =
                        parseFloat(invoice.materialCost || "0") || 0;
                      const serviceCharges = serviceCharge + materialCost;
                      const tax = parseFloat(invoice.taxAmount || "0");
                      const platformFee = parseFloat(
                        invoice.platformFee || "0",
                      );
                      const total = parseFloat(invoice.totalAmount);

                      // Calculate percentages
                      const servicePercent = (serviceCharges / total) * 100;
                      const taxPercent = (tax / total) * 100;
                      // Admin gets whatever is remaining to ensure bar is 100%
                      const adminPercent = 100 - servicePercent - taxPercent;

                      return (
                        <>
                          {/* Service Charges */}
                          {(invoice.laborCost || invoice.materialCost) && (
                            <div
                              className="bg-linear-to-r from-violet-400 to-indigo-500 h-full transition-all"
                              style={{ width: `${servicePercent}%` }}
                            />
                          )}
                          {/* Tax */}
                          {invoice.taxAmount &&
                            parseFloat(invoice.taxAmount) > 0 && (
                              <div
                                className="bg-linear-to-r from-gray-300 to-gray-400 h-full transition-all"
                                style={{ width: `${taxPercent}%` }}
                              />
                            )}
                          {/* Admin Fee - fills the remainder */}
                          {invoice.platformFee &&
                            parseFloat(invoice.platformFee) > 0 && (
                              <div
                                className="bg-linear-to-r from-amber-400 to-orange-500 h-full transition-all"
                                style={{
                                  width: `${Math.max(0, adminPercent)}%`,
                                }}
                              />
                            )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs mt-2 gap-2">
                    {(invoice.laborCost || invoice.materialCost) && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-linear-to-r from-violet-400 to-indigo-500" />
                        <span className="text-gray-600">Service</span>
                      </div>
                    )}
                    {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-linear-to-r from-gray-300 to-gray-400" />
                        <span className="text-gray-600">
                          Tax ({invoice.taxRate})
                        </span>
                      </div>
                    )}
                    {invoice.platformFee &&
                      parseFloat(invoice.platformFee) > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-linear-to-r from-amber-400 to-orange-500" />
                          <span className="text-gray-600">Admin</span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
