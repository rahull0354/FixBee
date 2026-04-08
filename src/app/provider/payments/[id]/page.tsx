'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Briefcase,
  IndianRupee,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  MapPin,
  Building2,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface PaymentDetails {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  providerEarning: string;
  platformFee: string;
  subTotal?: string;
  taxAmount?: string;
  taxRate?: string;
  status: 'pending' | 'paid' | 'processing' | 'failed';
  invoiceDate: string;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  finalPrice?: string;
  materialCost?: string;
  service?: {
    serviceTitle?: string;
    serviceType?: string;
    serviceDescription?: string;
    schedule?: {
      date: string;
      timeSlot?: string;
      preferredTime?: string;
    };
    serviceAddress?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    } | string;
  };
  serviceRequest?: {
    id: string;
    title?: string;
    serviceTitle?: string;
    serviceType?: string;
    serviceDescription?: string;
    schedule?: {
      date: string;
      timeSlot?: string;
      preferredTime?: string;
    };
    serviceAddress?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    } | string;
  };
  customer?: {
    name: string;
    email?: string;
  };
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
}

export default function ProviderPaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/provider');
      return;
    }
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId, isAuthenticated]);

  const loadPayment = async () => {
    try {
      setLoading(true);

      const response = await providerApi.getPaymentById(paymentId);
      const apiData = (response as any).data || response;

      // Provider Net Earning = subTotal (which is already service charge + material cost)
      const subTotal = parseFloat(apiData.subTotal || 0);

      // Override the backend's incorrect calculation with the correct subtotal
      apiData.providerEarning = subTotal.toFixed(2);

      setPayment(apiData);

      // Load customer details if available
      if (apiData.customer) {
        setCustomer(apiData.customer);
      }
    } catch (error: any) {
      toast.error('Failed to load payment details');
      router.push('/provider/payments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!payment) return;

    try {
      setDownloading(true);

      toast.info('Generating receipt PDF...', { id: 'receipt-download' });

      const { downloadProviderReceiptPDF } = await import('@/lib/utils/pdf');
      const { default: ProviderReceiptPDF } = await import('@/components/provider/ProviderReceiptPDF');

      await downloadProviderReceiptPDF({
        payment,
        serviceRequest: {
          id: payment.serviceRequest?.id,
          serviceTitle: payment.service?.serviceTitle || payment.serviceRequest?.serviceTitle || payment.serviceRequest?.title,
          serviceType: payment.service?.serviceType || payment.serviceRequest?.serviceType,
          serviceDescription: payment.service?.serviceDescription || payment.serviceRequest?.serviceDescription,
          schedule: payment.service?.schedule || payment.serviceRequest?.schedule,
          serviceAddress: payment.service?.serviceAddress || payment.serviceRequest?.serviceAddress,
        },
        customer: customer,
        provider: {
          name: user?.name,
          email: user?.email,
        },
        ReceiptPDFComponent: ProviderReceiptPDF,
      });

      toast.success('Receipt downloaded successfully!', { id: 'receipt-download' });
    } catch (error: any) {
      console.error('PDF download error:', error);
      toast.error('Failed to download receipt. Please try again.', {
        id: 'receipt-download',
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
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
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1 inline" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1 inline" />
            Failed
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address !== null) {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.pincode,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return '';
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!payment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/provider/payments"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Earnings
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Payment Details
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 break-all">
                {payment.invoiceNumber}
              </p>
            </div>
            <div className="self-start sm:self-auto">
              {getStatusBadge(payment.status)}
            </div>
          </div>
        </div>

        {/* Earnings Card */}
        <div id="payment-content" className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {/* Earnings Header */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-4 sm:p-6 md:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Your Earnings</h2>
                  <p className="text-emerald-100 text-xs sm:text-sm">Payment Summary</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-emerald-100">Net Earnings</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                  ₹{parseFloat(payment.providerEarning || '0').toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Content */}
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
            {/* Customer & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </h3>
                <p className="font-semibold text-gray-900">{customer?.name || 'N/A'}</p>
                {customer?.email && (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Service Type
                </h3>
                <p className="font-semibold text-gray-900">
                  {payment?.service?.serviceType || payment?.serviceRequest?.serviceType || 'N/A'}
                </p>
              </div>
            </div>

            {/* Service Information */}
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-100">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-900 mb-2 sm:mb-3 flex items-center gap-2">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                Service Details
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Service Title</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {payment?.service?.serviceTitle || payment?.serviceRequest?.serviceTitle || payment?.serviceRequest?.title || 'Service Request'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    Request ID: {payment?.serviceRequest?.id || 'N/A'}
                  </p>
                </div>

                {(payment?.service?.serviceDescription || payment?.serviceRequest?.serviceDescription) && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Description</p>
                    <p className="text-xs sm:text-sm text-gray-800">
                      {payment?.service?.serviceDescription || payment?.serviceRequest?.serviceDescription}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {(payment?.service?.schedule?.date || payment?.serviceRequest?.schedule?.date) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Service Date</p>
                      <p className="text-xs sm:text-sm text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-emerald-600" />
                        {formatDate(payment?.service?.schedule?.date || payment?.serviceRequest?.schedule?.date)}
                      </p>
                    </div>
                  )}

                  {(payment?.service?.serviceAddress || payment?.serviceRequest?.serviceAddress) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Service Address</p>
                      <p className="text-xs sm:text-sm text-gray-800 flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600 mt-0.5 sm:mt-1 shrink-0" />
                        <span className="break-words">{formatAddress(payment?.service?.serviceAddress || payment?.serviceRequest?.serviceAddress)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {payment.lineItems && payment.lineItems.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Service Items</h3>
                <div className="border border-gray-200 rounded-xl overflow-x-auto">
                  <div className="min-w-[600px]">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600">Item Ref</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600">Unit Price</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payment.lineItems
                          .filter(item => !item.description.toLowerCase().includes('platform fee'))
                          .map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-500 font-mono">
                              #{String(index + 1).padStart(3, '0')}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{item.description}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-600">
                              ₹{(parseFloat(item.unitPrice) || 0).toFixed(2)}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{parseFloat(item.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Breakdown */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Earnings Breakdown</h3>
              <div className="space-y-2 sm:space-y-3">
                {/* Total Amount (what customer paid) */}
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Amount Paid by Customer</span>
                  <span className="font-semibold text-gray-900">
                    ₹{parseFloat(payment.totalAmount || '0').toFixed(2)}
                  </span>
                </div>

                {/* Deductions */}
                {(parseFloat(payment.taxAmount || '0') > 0 || parseFloat(payment.platformFee || '0') > 0) && (
                  <div className="bg-red-50 rounded-lg p-2 sm:p-3 border border-red-100">
                    <p className="text-xs font-semibold text-red-800 mb-1 sm:mb-2">Deductions</p>

                    {/* Tax (deducted) */}
                    {payment.taxAmount && parseFloat(payment.taxAmount) > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-2">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Tax ({payment.taxRate || 0}% GST)
                        </span>
                        <span className="font-semibold text-red-600">
                          -₹{parseFloat(payment.taxAmount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Platform Fee (deducted) */}
                    {payment.platformFee && parseFloat(payment.platformFee) > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Platform Fee
                        </span>
                        <span className="font-semibold text-red-600">
                          -₹{parseFloat(payment.platformFee).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Net Earnings */}
                <div className="border-t-2 border-emerald-200 pt-2 sm:pt-3 mt-2 sm:mt-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Your Net Earnings</span>
                    <span className="font-bold text-emerald-600 text-lg sm:text-xl">
                      ₹{parseFloat(payment.providerEarning || '0').toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This amount will be credited to your account
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {payment.status === 'paid' && (
              <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-emerald-900">Payment Received</p>
                    <p className="text-xs sm:text-sm text-emerald-700 break-words">
                      Paid on {payment.paidAt ? formatDate(payment.paidAt) : 'N/A'}
                      {payment.paymentMethod && ` via ${payment.paymentMethod}`}
                    </p>
                    {payment.transactionId && (
                      <p className="text-xs text-emerald-600 mt-1 break-all">
                        Transaction ID: {payment.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'pending' && (
              <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-amber-900">Payment Pending</p>
                    <p className="text-xs sm:text-sm text-amber-700">
                      Your earnings will be processed soon
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'processing' && (
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 shrink-0 animate-spin" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-blue-900">Payment Processing</p>
                    <p className="text-xs sm:text-sm text-blue-700">
                      Your payment is being processed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm"
              size="sm"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">Receipt</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm"
              size="sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24 sm:h-10 sm:w-32 mb-3 sm:mb-4" />
        <Skeleton className="h-10 w-48 sm:h-14 sm:w-64 mb-2" />
        <Skeleton className="h-4 w-64 sm:h-6 sm:w-96 mb-6 sm:mb-8" />

        <Skeleton className="h-64 sm:h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
