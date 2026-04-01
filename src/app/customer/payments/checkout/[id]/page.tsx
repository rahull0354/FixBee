'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { customerApi } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Loader2,
  CheckCircle2,
  MapPin,
  Clock,
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import { PaymentIntent } from '@stripe/stripe-js';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);

  // Stripe payment state
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    paymentId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/customer');
      return;
    }
    if (invoiceId) {
      loadInvoiceAndCreateIntent();
    }
  }, [invoiceId, isAuthenticated]);

  const loadInvoiceAndCreateIntent = async () => {
    try {
      setLoading(true);
      setCreatingIntent(true);

      console.log('=================================');
      console.log('🔄 Loading Invoice and Creating Payment Intent');
      console.log('Invoice ID:', invoiceId);
      console.log('=================================');

      // First, try to load as invoice
      try {
        const response = await customerApi.getInvoice(invoiceId);
        console.log('Raw Invoice API Response:', response);

        const apiData = (response as any).data || response;
        console.log('Extracted Invoice Data:', JSON.stringify(apiData, null, 2));

        setInvoice(apiData);

        // Check if invoice is already paid
        if (apiData.status === 'paid') {
          toast.info('This invoice has already been paid');
          router.push(`/customer/payments/invoices/${invoiceId}`);
          return;
        }

        // Load service request details
        if (apiData.requestId) {
          try {
            const requestResponse = await customerApi.getServiceRequest(apiData.requestId);

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
            setServiceRequest(finalRequestData);

            // Fetch provider details
            if (finalRequestData?.serviceProviderId) {
              try {
                const providerResponse = await customerApi.getProvider(finalRequestData.serviceProviderId);

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
                console.error('Error loading provider:', providerErr);
              }
            }
          } catch (err) {
            console.error('Error loading service request:', err);
          }
        }

        // Create Stripe payment intent
        console.log('Creating Stripe Payment Intent...');
        try {
          const intentResponse = await customerApi.createPaymentIntent(invoiceId);
          console.log('Payment Intent Response:', intentResponse);

          const intentData = (intentResponse as any).data || intentResponse;
          console.log('Payment Intent Created:', intentData);

          // Validate required fields
          if (!intentData.clientSecret) {
            console.error('Invalid payment intent response - missing clientSecret:', intentData);
            toast.error('Invalid payment intent response from server');
            return;
          }

          setPaymentIntent({
            clientSecret: intentData.clientSecret,
            paymentIntentId: intentData.paymentIntentId,
            paymentId: intentData.paymentId,
            amount: intentData.amount || parseFloat(apiData.totalAmount),
          });

          console.log('Invoice and Payment Intent Loaded Successfully');
        } catch (intentError: any) {
          console.error('Error creating payment intent:', intentError);
          toast.error(intentError?.response?.data?.message || 'Failed to create payment intent');
          return;
        }
      } catch (invoiceError: any) {
        console.error('Error loading invoice:', invoiceError);
        toast.error(invoiceError?.response?.data?.message || 'Failed to load invoice');
        router.push('/customer/payments');
      }
    } catch (error: any) {
      console.error('Error in loadInvoiceAndCreateIntent:', error);
      toast.error(error?.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
      setCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = useCallback((paymentIntent: PaymentIntent) => {
    console.log('Payment Successful:', paymentIntent);
    toast.success('Payment successful! Redirecting to receipt...');

    // Redirect to invoice detail page after a short delay
    setTimeout(() => {
      router.push(`/customer/payments/invoices/${invoiceId}`);
    }, 2000);
  }, [invoiceId, router]);

  const handlePaymentError = useCallback((error: string) => {
    console.error('Payment Failed:', error);
  }, []);

  const handleCancelPayment = useCallback(() => {
    toast.info('Payment cancelled');
    router.push('/customer/payments');
  }, [router]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  const totalAmount = parseFloat(invoice.totalAmount || '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/customer/payments"
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Checkout, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">Complete your payment securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Service Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details Card */}
            <Card className="border-2 border-sky-100 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Service Details</h2>
                      <p className="text-sky-100 text-sm">Review your service information</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Service Title</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serviceRequest?.serviceTitle || serviceRequest?.title || 'Service Request'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Service Type</p>
                      <p className="text-gray-800 capitalize">
                        {serviceRequest?.serviceType || 'N/A'}
                      </p>
                    </div>

                    {provider && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Service Provider</p>
                        <p className="text-gray-800 flex items-center gap-2">
                          <User className="h-4 w-4 text-sky-600" />
                          {provider?.name || provider?.businessName || 'Service Provider'}
                        </p>
                      </div>
                    )}
                  </div>

                  {serviceRequest?.serviceDescription && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700 leading-relaxed">{serviceRequest.serviceDescription}</p>
                    </div>
                  )}

                  {serviceRequest?.serviceAddress && (
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                      <p className="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Service Address
                      </p>
                      <p className="text-gray-800 text-sm">
                        {typeof serviceRequest.serviceAddress === 'object'
                          ? `${serviceRequest.serviceAddress?.street || ''}, ${serviceRequest.serviceAddress?.city || ''}, ${serviceRequest.serviceAddress?.state || ''} ${serviceRequest.serviceAddress?.pincode || ''}`.trim()
                          : serviceRequest.serviceAddress}
                      </p>
                    </div>
                  )}

                  {serviceRequest?.schedule?.date && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Service Date
                      </p>
                      <p className="text-gray-800 text-sm font-medium">
                        {formatDate(serviceRequest.schedule.date)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            {creatingIntent ? (
              <Card className="border-2 border-sky-100 shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-sky-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-900">Preparing Payment...</p>
                  <p className="text-sm text-gray-600 mt-2">Please wait while we set up your secure payment</p>
                </div>
              </Card>
            ) : paymentIntent ? (
              <Card className="border-2 border-sky-100 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Secure Payment</h2>
                        <p className="text-sky-100 text-sm">Powered by Stripe</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <StripePaymentForm
                      clientSecret={paymentIntent.clientSecret}
                      paymentIntentId={paymentIntent.paymentIntentId}
                      paymentId={paymentIntent.paymentId}
                      amount={paymentIntent.amount}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={handleCancelPayment}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-red-100 shadow-xl p-8">
                <div className="text-center">
                  <p className="text-red-600 font-semibold">Failed to initialize payment</p>
                  <Button
                    onClick={loadInvoiceAndCreateIntent}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-sky-100 shadow-xl sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Service Charge</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(invoice.subtotal || invoice.laborCost || '0')}
                    </span>
                  </div>

                  {invoice.materialCost && parseFloat(invoice.materialCost) > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Material Cost</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.materialCost)}
                      </span>
                    </div>
                  )}

                  {invoice.platformFee && parseFloat(invoice.platformFee) > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.platformFee)}
                      </span>
                    </div>
                  )}

                  {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.taxAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-sky-600 flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      {parseFloat(invoice.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Invoice Number */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-mono font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                </div>

                {/* Payment Security Badge */}
                <div className="mt-6 p-4 bg-sky-50 rounded-xl border border-sky-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    <p className="font-semibold text-sky-900">Secure Payment</p>
                  </div>
                  <p className="text-xs text-sky-800">
                    Your payment is processed securely through Stripe. We do not store your card details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            </Card>

            <Card className="p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-32 w-full" />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
