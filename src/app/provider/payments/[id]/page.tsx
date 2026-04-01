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

      console.log('📦 Payment Detail Response:', apiData);

      setPayment(apiData);

      // The new backend structure includes 'service' field with service details
      // No need to fetch separately anymore
      console.log('✅ Service details from payment:', apiData.service);

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

  const formatDate = (dateString: string) => {
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
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/provider/payments"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Earnings
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Payment Details
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {payment.invoiceNumber}
              </p>
            </div>
            {getStatusBadge(payment.status)}
          </div>
        </div>

        {/* Earnings Card */}
        <div id="payment-content" className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {/* Earnings Header */}
          <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <IndianRupee className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Your Earnings</h2>
                  <p className="text-emerald-100 text-sm">Payment Summary</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-100">Net Earnings</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  ₹{parseFloat(payment.providerEarning || '0').toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Content */}
          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
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
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Service Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Service Title</p>
                  <p className="font-semibold text-gray-900">
                    {payment?.service?.serviceTitle || payment?.serviceRequest?.serviceTitle || payment?.serviceRequest?.title || 'Service Request'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    Request ID: {payment?.requestId || 'N/A'}
                  </p>
                </div>

                {(payment?.service?.serviceDescription || payment?.serviceRequest?.serviceDescription) && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-800">
                      {payment?.service?.serviceDescription || payment?.serviceRequest?.serviceDescription}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(payment?.service?.schedule?.date || payment?.serviceRequest?.schedule?.date) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Service Date</p>
                      <p className="text-sm text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-emerald-600" />
                        {formatDate(payment?.service?.schedule?.date || payment?.serviceRequest?.schedule?.date)}
                      </p>
                    </div>
                  )}

                  {(payment?.service?.serviceAddress || payment?.serviceRequest?.serviceAddress) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Service Address</p>
                      <p className="text-sm text-gray-800 flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600 mt-1 shrink-0" />
                        <span>{formatAddress(payment?.service?.serviceAddress || payment?.serviceRequest?.serviceAddress)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {payment.lineItems && payment.lineItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Service Items</h3>
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
                      {payment.lineItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-center text-sm text-gray-500 font-mono">
                            #{String(index + 1).padStart(3, '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            ₹{(parseFloat(item.unitPrice) || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            ₹{parseFloat(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Earnings Breakdown */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Breakdown</h3>
              <div className="space-y-3">
                {/* Total Amount (what customer paid) */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount Paid by Customer</span>
                  <span className="font-semibold text-gray-900">
                    ₹{parseFloat(payment.totalAmount || '0').toFixed(2)}
                  </span>
                </div>

                {/* Deductions */}
                {(parseFloat(payment.taxAmount || '0') > 0 || parseFloat(payment.platformFee || '0') > 0) && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <p className="text-xs font-semibold text-red-800 mb-2">Deductions</p>

                    {/* Tax (deducted) */}
                    {payment.taxAmount && parseFloat(payment.taxAmount) > 0 && (
                      <div className="flex justify-between text-sm mb-2">
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
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Platform Fee (15%)
                        </span>
                        <span className="font-semibold text-red-600">
                          -₹{parseFloat(payment.platformFee).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Net Earnings */}
                <div className="border-t-2 border-emerald-200 pt-3 mt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-900">Your Net Earnings</span>
                    <span className="font-bold text-emerald-600 text-xl">
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
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-emerald-900">Payment Received</p>
                    <p className="text-sm text-emerald-700">
                      Paid on {payment.paidAt ? formatDate(payment.paidAt) : 'N/A'}
                      {payment.paymentMethod && ` via ${payment.paymentMethod}`}
                    </p>
                    {payment.transactionId && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Transaction ID: {payment.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'pending' && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">Payment Pending</p>
                    <p className="text-sm text-amber-700">
                      Your earnings will be processed soon
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'processing' && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="font-bold text-blue-900">Payment Processing</p>
                    <p className="text-sm text-blue-700">
                      Your payment is being processed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print bg-gray-50 px-6 py-4 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Print/Download
            </Button>
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
