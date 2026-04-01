'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { customerApi } from '@/lib/api';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

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
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
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
      router.push('/login/customer');
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
          const requestResponse = await customerApi.getServiceRequest(apiData.requestId);

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
              const providerResponse = await customerApi.getProvider(finalRequestData.serviceProviderId);

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
      toast.error('Failed to load invoice');
      router.push('/customer/payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
            <CheckCircle className="h-3 w-3 mr-1 inline" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1 inline" />
            Pending
          </Badge>
        );
      case 'overdue':
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
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      if (!invoice || !serviceRequest) {
        toast.error('Invoice not loaded');
        return;
      }

      toast.info('Generating PDF...', { id: 'pdf-download' });

      const { downloadInvoicePDF } = await import('@/lib/utils/pdf');
      const { InvoicePDF } = await import('@/components/invoice/InvoicePDF');

      await downloadInvoicePDF({
        invoice,
        serviceRequest,
        provider,
        user,
        InvoicePDFComponent: InvoicePDF,
      });

      toast.success('Invoice downloaded successfully!', { id: 'pdf-download' });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download invoice. Please try again.', { id: 'pdf-download' });
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
        toast.info('Copy the link to share');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/customer/payments"
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Invoice Details
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {invoice.invoiceNumber}
              </p>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        {/* Invoice Card */}
        <div id="invoice-content" className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">FixBee</h2>
                  <p className="text-sky-100 text-sm">Home Services Platform</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-sky-100">Invoice Date</p>
                <p className="text-lg font-semibold">{formatDate(invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            {/* Bill To - Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-2">Bill To</h3>
                <p className="font-semibold text-gray-900">{user?.name || 'Customer'}</p>
                <p className="text-sm text-gray-600">{user?.email || ''}</p>
                {serviceRequest?.serviceAddress && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typeof serviceRequest.serviceAddress === 'object'
                      ? `${serviceRequest.serviceAddress.street || ''}, ${serviceRequest.serviceAddress.city || ''}, ${serviceRequest.serviceAddress.state || ''}`.trim()
                      : serviceRequest.serviceAddress}
                  </p>
                )}
              </div>

              {provider && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-2">Service Provider</h3>
                  <p className="font-semibold text-gray-900">
                    {provider?.name || provider?.businessName || provider?.contactPerson || 'Service Provider'}
                  </p>
                  {(provider?.businessName || provider?.contactPerson) && (
                    <p className="text-sm text-gray-600">
                      {provider?.businessName || provider?.contactPerson}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Service Information */}
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <h3 className="text-sm font-bold text-sky-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Service Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Service Title</p>
                  <p className="font-semibold text-gray-900">
                    {serviceRequest?.serviceTitle || invoice.serviceRequest?.title || 'Service Request'}
                  </p>
                  <p className="text-xs text-sky-700 mt-1 font-medium">Request ID: {serviceRequest?.id || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Service Type</p>
                  <p className="text-sm text-gray-800 capitalize">
                    {serviceRequest?.serviceType || invoice.serviceRequest?.serviceType || 'N/A'}
                  </p>
                </div>

                {serviceRequest?.serviceDescription && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-800">
                      {serviceRequest?.serviceDescription}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceRequest?.schedule?.date && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Service Date</p>
                      <p className="text-sm text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-sky-600" />
                        {new Date(serviceRequest?.schedule?.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {(serviceRequest?.schedule?.timeSlot || serviceRequest?.schedule?.preferredTime) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Preferred Time</p>
                      <p className="text-sm text-gray-800 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-sky-600" />
                        {serviceRequest?.schedule?.timeSlot || serviceRequest?.schedule?.preferredTime || 'Not specified'}
                      </p>
                    </div>
                  )}
                </div>

                {serviceRequest?.serviceAddress && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Service Address</p>
                    <p className="text-sm text-gray-800 flex items-start gap-1">
                      <MapPin className="h-3 w-3 text-sky-600 mt-1 shrink-0" />
                      <span>
                        {typeof serviceRequest.serviceAddress === 'object'
                          ? `${serviceRequest.serviceAddress.street || ''}, ${serviceRequest.serviceAddress.city || ''}, ${serviceRequest.serviceAddress.state || ''} ${serviceRequest.serviceAddress.pincode || ''}`.trim()
                          : serviceRequest.serviceAddress}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Details</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Item Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.lineItems?.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-center text-sm text-gray-500 font-mono">
                          #{String(index + 1).padStart(3, '0')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">₹{(parseFloat(item.unitPrice) || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{(parseFloat(item.total) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              {/* Calculate service charge from line items */}
              {(() => {
                const serviceChargeItem = invoice.lineItems?.find((item: any) => item.itemType === 'service');
                const materialCostItem = invoice.lineItems?.find((item: any) => item.itemType === 'material');
                const platformFeeItem = invoice.lineItems?.find((item: any) => item.itemType === 'additional_charge');

                const serviceCharge = serviceChargeItem ? parseFloat(serviceChargeItem.total) : parseFloat(invoice.laborCost) || 0;
                const materialCost = materialCostItem ? parseFloat(materialCostItem.total) : parseFloat(invoice.materialCost) || 0;
                const platformFee = platformFeeItem ? parseFloat(platformFeeItem.total) : parseFloat(invoice.platformFee) || 0;
                const subtotal = serviceCharge + materialCost;
                const taxAmount = parseFloat(invoice.taxAmount) || 0;

                // Calculate correct total: service charges + material cost + platform fee + tax
                const calculatedTotal = serviceCharge + materialCost + platformFee + taxAmount;

                return (
                  <>
                    {/* Service Charge */}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <span className="text-gray-600">Service Charges</span>
                          <p className="text-xs text-gray-500 mt-0.5">Professional service fee</p>
                        </div>
                        <span className="font-semibold text-gray-900">₹{serviceCharge.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Material Cost */}
                    {materialCost > 0 && (
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <span className="text-gray-600">Material Cost</span>
                          {materialCostItem?.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{materialCostItem.description}</p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">₹{materialCost.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Subtotal (if not showing items separately) */}
                    {serviceCharge === 0 && materialCost === 0 && (
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <span className="text-gray-600">Service Charges</span>
                          <p className="text-xs text-gray-500 mt-0.5">(inclusive of material cost)</p>
                        </div>
                        <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Platform Fee */}
                    {platformFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-semibold text-gray-900">₹{platformFee.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Tax */}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax ({invoice.taxRate || 0}%)</span>
                        <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-gray-200 pt-3">
                      <div className="flex justify-between text-base">
                        <span className="font-bold text-gray-900">Total Amount</span>
                        <span className="font-bold text-sky-600 text-xl">₹{calculatedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Payment Information */}
            {invoice.status === 'paid' && (
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-sky-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sky-900">Payment Successful</p>
                    <p className="text-sm text-sky-700">
                      Paid on {invoice.paidAt ? formatDate(invoice.paidAt) : 'N/A'}
                      {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
                    </p>
                    {invoice.transactionId && (
                      <p className="text-xs text-sky-600 mt-1">Transaction ID: {invoice.transactionId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {invoice.status === 'pending' && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">Payment Pending</p>
                    <p className="text-sm text-amber-700">
                      Complete the payment to generate your official receipt
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            {invoice.status === 'pending' && (
              <Button
                onClick={() => router.push(`/customer/payments/checkout/${invoice.id}`)}
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
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-14 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />

        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
