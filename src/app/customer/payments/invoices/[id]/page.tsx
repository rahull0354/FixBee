"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerApi } from "@/lib/api";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Briefcase,
  IndianRupee,
  Download,
  Printer,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
  itemType: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  subtotal: string;
  materialCost: string;
  laborCost: string;
  taxAmount: string;
  taxRate: string;
  platformFee: string;
  providerEarning: string;
  paymentMethod?: string;
  transactionId?: string;
  requestId?: string;
  lineItems: LineItem[];
  serviceRequest?: {
    title: string;
    serviceType: string;
  };
  provider?: {
    name: string;
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login/customer");
      return;
    }
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, isAuthenticated]);

  const loadInvoice = async () => {
    try {
      setLoading(true);

      const response = await customerApi.getInvoice(invoiceId);
      const apiData = (response as any).data || response;

      setInvoice(apiData);

      // Load service request details if available
      if (apiData.requestId) {
        try {
          const requestResponse = await customerApi.getServiceRequest(
            apiData.requestId,
          );

          // The data is nested inside a "request" object
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

          // Extract the nested request object if it exists
          const finalRequestData = requestData?.request || requestData;

          setServiceRequest(finalRequestData);

          // Fetch provider details if we have the provider ID
          if (finalRequestData?.serviceProviderId) {
            try {
              const providerResponse = await customerApi.getProvider(
                finalRequestData.serviceProviderId,
              );

              // Try different possible structures
              let providerData = null;
              if ((providerResponse as any).data?.provider) {
                providerData = (providerResponse as any).data.provider;
              } else if ((providerResponse as any).data) {
                providerData = (providerResponse as any).data;
              } else if ((providerResponse as any).provider) {
                providerData = (providerResponse as any).provider;
              } else {
                providerData = providerResponse;
              }

              setProvider(providerData);
            } catch (providerErr) {
              // Continue without provider data
            }
          }
        } catch (err) {
          // Continue without service request data
        }
      }
    } catch (error: any) {
      toast.error("Failed to load invoice");
      router.push("/customer/payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
            <CheckCircle className="h-3 w-3 mr-1 inline" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1 inline" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1 inline" />
            Overdue
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      if (!invoice || !serviceRequest) {
        toast.error("Invoice not loaded");
        return;
      }

      toast.info("Generating PDF...", { id: "pdf-download" });

      const { downloadInvoicePDF } = await import("@/lib/utils/pdf");
      const { InvoicePDF } = await import("@/components/invoice/InvoicePDF");

      await downloadInvoicePDF({
        invoice,
        serviceRequest,
        provider,
        user,
        InvoicePDFComponent: InvoicePDF,
      });

      toast.success("Invoice downloaded successfully!", { id: "pdf-download" });
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download invoice. Please try again.", {
        id: "pdf-download",
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoice?.invoiceNumber}`,
          text: `Invoice for ₹${invoice?.totalAmount} from FixBee`,
          url: window.location.href,
        });
      } else {
        toast.info("Copy the link to share");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/customer/payments"
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Payments</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Invoice Details
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 truncate">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="self-start sm:self-auto">
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <div
          id="invoice-content"
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-sky-100 overflow-hidden"
        >
          {/* Invoice Header */}
          <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 p-4 sm:p-6 lg:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shrink-0">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">FixBee</h2>
                  <p className="text-sky-100 text-xs sm:text-sm">Home Services Platform</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-sky-100">Invoice Date</p>
                <p className="text-base sm:text-lg font-semibold">
                  {formatDate(invoice.invoiceDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Bill To - Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-1.5 sm:mb-2">
                  Bill To
                </h3>
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {user?.name || "Customer"}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{user?.email || ""}</p>
                {serviceRequest?.serviceAddress && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {typeof serviceRequest.serviceAddress === "object"
                      ? `${serviceRequest.serviceAddress.street || ""}, ${serviceRequest.serviceAddress.city || ""}, ${serviceRequest.serviceAddress.state || ""}`.trim()
                      : serviceRequest.serviceAddress}
                  </p>
                )}
              </div>

              {provider && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-1.5 sm:mb-2">
                    Service Provider
                  </h3>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {provider?.name ||
                      provider?.businessName ||
                      provider?.contactPerson ||
                      "Service Provider"}
                  </p>
                  {(provider?.businessName || provider?.contactPerson) && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {provider?.businessName || provider?.contactPerson}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Service Information */}
            <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-sky-100">
              <h3 className="text-xs sm:text-sm font-bold text-sky-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Service Details
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Service Title</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {serviceRequest?.serviceTitle ||
                      invoice.serviceRequest?.title ||
                      "Service Request"}
                  </p>
                  <p className="text-xs text-sky-700 mt-0.5 sm:mt-1 font-medium">
                    Request ID: {serviceRequest?.id || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Service Type</p>
                  <p className="text-xs sm:text-sm text-gray-800 capitalize">
                    {serviceRequest?.serviceType ||
                      invoice.serviceRequest?.serviceType ||
                      "N/A"}
                  </p>
                </div>

                {serviceRequest?.serviceDescription && (
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Description</p>
                    <p className="text-xs sm:text-sm text-gray-800">
                      {serviceRequest?.serviceDescription}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {serviceRequest?.schedule?.date && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Service Date</p>
                      <p className="text-xs sm:text-sm text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-sky-600 shrink-0" />
                        <span className="truncate">
                          {new Date(
                            serviceRequest?.schedule?.date,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  )}

                  {(serviceRequest?.schedule?.timeSlot ||
                    serviceRequest?.schedule?.preferredTime) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">
                        Preferred Time
                      </p>
                      <p className="text-xs sm:text-sm text-gray-800 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-sky-600 shrink-0" />
                        <span className="truncate">
                          {serviceRequest?.schedule?.timeSlot ||
                            serviceRequest?.schedule?.preferredTime ||
                            "Not specified"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {serviceRequest?.serviceAddress && (
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">
                      Service Address
                    </p>
                    <p className="text-xs sm:text-sm text-gray-800 flex items-start gap-1">
                      <MapPin className="h-3 w-3 text-sky-600 mt-0.5 sm:mt-1 shrink-0" />
                      <span className="flex-1">
                        {typeof serviceRequest.serviceAddress === "object"
                          ? `${serviceRequest.serviceAddress.street || ""}, ${serviceRequest.serviceAddress.city || ""}, ${serviceRequest.serviceAddress.state || ""} ${serviceRequest.serviceAddress.pincode || ""}`.trim()
                          : serviceRequest.serviceAddress}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                Invoice Details
              </h3>
              <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="w-full min-w-[500px] sm:min-w-0">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                          Item Ref
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                          Description
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                          Unit Price
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.lineItems?.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">
                            #{String(index + 1).padStart(3, "0")}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 max-w-[150px] sm:max-w-none">
                            <span className="block truncate">{item.description}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            ₹{(parseFloat(item.unitPrice) || 0).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                            ₹{(parseFloat(item.total) || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 sm:space-y-3">
              {/* Calculate service charge from line items */}
              {(() => {
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
                  : parseFloat(invoice.laborCost) || 0;
                const materialCost = materialCostItem
                  ? parseFloat(materialCostItem.total)
                  : parseFloat(invoice.materialCost) || 0;
                const platformFee = platformFeeItem
                  ? parseFloat(platformFeeItem.total)
                  : parseFloat(invoice.platformFee) || 0;
                const subtotal = serviceCharge + materialCost;
                const taxAmount = parseFloat(invoice.taxAmount) || 0;

                // Calculate correct total: service charges + material cost + platform fee + tax
                const calculatedTotal =
                  serviceCharge + materialCost + platformFee + taxAmount;

                return (
                  <>
                    {/* Service Charge */}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between items-start text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Service Charges</span>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            Professional service fee
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{serviceCharge.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Material Cost */}
                    {materialCost > 0 && (
                      <div className="flex justify-between items-start text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Material Cost</span>
                          {materialCostItem?.description && (
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {materialCostItem.description}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{materialCost.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Subtotal (if not showing items separately) */}
                    {serviceCharge === 0 && materialCost === 0 && (
                      <div className="flex justify-between items-start text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Service Charges</span>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            (inclusive of material cost)
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{subtotal.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Platform Fee */}
                    {platformFee > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-semibold text-gray-900">
                          ₹{platformFee.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Tax */}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">
                          Tax ({invoice.taxRate || 0}%)
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₹{taxAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-gray-200 pt-2 sm:pt-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="font-bold text-gray-900">
                          Total Amount
                        </span>
                        <span className="font-bold text-sky-600 text-lg sm:text-xl">
                          ₹{calculatedTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Payment Information */}
            {invoice.status === "paid" && (
              <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-sky-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sky-900 text-sm sm:text-base">Payment Successful</p>
                    <p className="text-xs sm:text-sm text-sky-700">
                      Paid on{" "}
                      {invoice.paidAt ? formatDate(invoice.paidAt) : "N/A"}
                      {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
                    </p>
                    {invoice.transactionId && (
                      <p className="text-[10px] sm:text-xs text-sky-600 mt-1 font-mono truncate">
                        Transaction ID: {invoice.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {invoice.status === "pending" && (
              <div className="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-900 text-sm sm:text-base">Payment Pending</p>
                    <p className="text-xs sm:text-sm text-amber-700">
                      Complete the payment to generate your official receipt
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">Download</span>
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Share
            </Button>

            {invoice.status === "pending" && (
              <Button
                onClick={() =>
                  router.push(`/customer/payments/checkout/${invoice.id}`)
                }
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm px-4 sm:px-6 py-2"
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24 sm:h-10 sm:w-32 mb-3 sm:mb-4" />
        <Skeleton className="h-10 w-48 sm:h-14 sm:w-64 mb-1 sm:mb-2" />
        <Skeleton className="h-5 w-32 sm:h-6 sm:w-40 mb-6 sm:mb-8" />

        <Skeleton className="h-72 sm:h-96 w-full rounded-xl sm:rounded-2xl" />
      </div>
    </div>
  );
}
