'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { customerApi } from '@/lib/api';
import { ArrowLeft, Calendar, User, Briefcase, Loader2, CheckCircle2, MapPin, Clock, CreditCard, Smartphone, Building2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [isRequestDirectPayment, setIsRequestDirectPayment] = useState(false);

  // Payment form fields
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Log user data
  console.log('👤 Authenticated User:', user);
  console.log('👤 User Name:', user?.name);
  console.log('👤 User Email:', user?.email);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/customer');
      return;
    }
    if (invoiceId) {
      loadPaymentData();
    }
  }, [invoiceId, isAuthenticated]);

  const loadInvoice = async () => {
    try {
      setLoading(true);

      console.log('=================================');
      console.log('🔄 Loading Invoice and Service Data');
      console.log('Invoice ID:', invoiceId);
      console.log('=================================');

      // First, try to load as invoice
      try {
        const response = await customerApi.getInvoice(invoiceId);
        console.log('📦 Raw Invoice API Response:', response);

        const apiData = (response as any).data || response;
        console.log('📄 Extracted Invoice Data:', JSON.stringify(apiData, null, 2));
        console.log('📄 Invoice Request ID:', apiData?.requestId);

        setInvoice(apiData);

        // Load service request details
        if (apiData.requestId) {
          try {
            console.log('----------------------------------');
            console.log('🔍 Fetching Service Request...');
            console.log('Request ID:', apiData.requestId);

            const requestResponse = await customerApi.getServiceRequest(apiData.requestId);
            console.log('📦 Raw Service Request Response:', requestResponse);

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

            console.log('📋 Extracted Request Data:', JSON.stringify(requestData, null, 2));

            // Extract the nested request object if it exists
            const finalRequestData = requestData?.request || requestData;
            console.log('✅ Final Request Data:', JSON.stringify(finalRequestData, null, 2));

            setServiceRequest(finalRequestData);

            // Fetch provider details if we have the provider ID
            if (finalRequestData?.serviceProviderId) {
              console.log('----------------------------------');
              console.log('👷 Fetching Provider Details...');
              console.log('Provider ID:', finalRequestData.serviceProviderId);

              try {
                const providerResponse = await customerApi.getProvider(finalRequestData.serviceProviderId);
                console.log('👷 Raw Provider Response:', providerResponse);
                console.log('👷 Response Type:', typeof providerResponse);
                console.log('👷 Response Keys:', Object.keys(providerResponse || {}));

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

                console.log('✅ Extracted Provider Data:', JSON.stringify(providerData, null, 2));
                console.log('👷 Provider Name:', providerData?.name);
                console.log('👷 Provider BusinessName:', providerData?.businessName);
                console.log('👷 Provider ContactPerson:', providerData?.contactPerson);
                console.log('👷 Provider Keys:', Object.keys(providerData || {}));

                setProvider(providerData);
              } catch (providerErr) {
                console.error('❌ Error loading provider:', providerErr);
                console.error('Error Details:', JSON.stringify(providerErr, null, 2));
                // Continue without provider data
              }
            } else {
              console.log('⚠️ No serviceProviderId found in request');
            }

            console.log('✅ Service Request Loaded Successfully');
          } catch (err) {
            console.error('❌ Error loading service request:', err);
          }
        }

        console.log('=================================');
        console.log('✅ Data Loading Complete');
        console.log('=================================');
      } catch (invoiceError: any) {
        // Invoice not found, try as request ID
        if (invoiceError?.response?.status === 404) {
          console.log('📝 Invoice not found, loading as service request...');
          setIsRequestDirectPayment(true);

          try {
            const requestResponse = await customerApi.getServiceRequest(invoiceId);
            console.log('📦 Raw Service Request Response:', requestResponse);

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

            console.log('📋 Extracted Request Data:', JSON.stringify(requestData, null, 2));

            // Extract the nested request object if it exists
            const finalRequestData = requestData?.request || requestData;
            console.log('✅ Final Request Data:', JSON.stringify(finalRequestData, null, 2));

            setServiceRequest(finalRequestData);

            // Fetch provider details if we have the provider ID
            if (finalRequestData?.serviceProviderId) {
              console.log('----------------------------------');
              console.log('👷 Fetching Provider Details...');
              console.log('Provider ID:', finalRequestData.serviceProviderId);

              try {
                const providerResponse = await customerApi.getProvider(finalRequestData.serviceProviderId);
                console.log('👷 Raw Provider Response:', providerResponse);

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

                console.log('✅ Extracted Provider Data:', JSON.stringify(providerData, null, 2));
                setProvider(providerData);
              } catch (providerErr) {
                console.error('❌ Error loading provider:', providerErr);
                // Continue without provider data
              }
            }

            console.log('✅ Service Request Loaded Successfully (Direct Payment Mode)');
          } catch (requestError: any) {
            console.error('❌ Error loading service request:', requestError);
            toast.error('Failed to load service request details');
            router.push('/customer/requests');
          }
        } else {
          throw invoiceError;
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading payment data:', error);
      toast.error('Failed to load payment details');
      router.push('/customer/requests');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // For direct request payment (no invoice yet), we need to handle it differently
    if (!invoice && !isRequestDirectPayment) {
      toast.error('Invoice not found');
      return;
    }

    // Validate payment fields based on selected method
    if (selectedPaymentMethod === 'upi' && !upiId) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 16) {
        toast.error('Please enter a valid card number');
        return;
      }
      if (!cardName) {
        toast.error('Please enter cardholder name');
        return;
      }
      if (!expiryDate) {
        toast.error('Please enter expiry date');
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    if (selectedPaymentMethod === 'netbanking' && !selectedBank) {
      toast.error('Please select your bank');
      return;
    }

    try {
      setProcessing(true);

      // For direct request payment, backend will create invoice
      if (isRequestDirectPayment && serviceRequest) {
        toast.info('Processing payment and creating invoice...');

        // Backend should handle creating invoice and processing payment
        // For now, we'll show a message that this feature is coming soon
        toast.error('Direct request payment is being set up. Please try again later.');
        setProcessing(false);
        return;
      }

      // Call the actual payment API for existing invoices
      const paymentData = {
        paymentMethod: selectedPaymentMethod.toUpperCase(),
        paymentId: `payment_${Date.now()}`,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await customerApi.payInvoice(invoice.id, paymentData);

      toast.success('Payment successful! Redirecting to receipt...');

      // Redirect to invoice detail page to view receipt
      setTimeout(() => {
        router.push(`/customer/payments/invoices/${invoice.id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  const finalPrice = invoice.totalAmount || invoice.subtotal || serviceRequest?.finalPrice || serviceRequest?.estimatedPrice || serviceRequest?.pricing?.final || invoice.amount || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 px-4 py-6 sm:py-8">
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
          <p className="text-gray-600">
            Complete your payment securely
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Scrollable Content */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
            {/* Service Details Card */}
            <Card className="border-2 border-sky-100 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 text-white">
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

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Service Title</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serviceRequest?.serviceTitle || serviceRequest?.title || invoice?.serviceRequest?.title || 'Service Request'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Service Type</p>
                      <p className="text-gray-800 capitalize">
                        {serviceRequest?.serviceType || invoice?.serviceRequest?.serviceType || 'N/A'}
                      </p>
                    </div>

                    {provider && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Service Provider</p>
                        <p className="text-gray-800 flex items-center gap-2">
                          <User className="h-4 w-4 text-sky-600" />
                          {provider?.name || provider?.businessName || provider?.contactPerson || 'Service Provider'}
                        </p>
                      </div>
                    )}
                  </div>

                  {serviceRequest?.serviceDescription && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700 leading-relaxed">
                        {serviceRequest?.serviceDescription}
                      </p>
                    </div>
                  )}

                  {serviceRequest?.serviceAddress && (
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                      <p className="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Service Address
                      </p>
                      <p className="text-gray-800 text-sm">
                        {typeof serviceRequest?.serviceAddress === 'object'
                          ? `${serviceRequest?.serviceAddress?.street || ''}, ${serviceRequest?.serviceAddress?.city || ''}, ${serviceRequest?.serviceAddress?.state || ''} ${serviceRequest?.serviceAddress?.pincode || ''}`.trim()
                          : serviceRequest?.serviceAddress}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serviceRequest?.schedule?.date && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Service Date
                        </p>
                        <p className="text-gray-800 text-sm font-medium">
                          {new Date(serviceRequest?.schedule?.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}

                    {(serviceRequest?.schedule?.timeSlot || serviceRequest?.schedule?.preferredTime) && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Preferred Time
                        </p>
                        <p className="text-gray-800 text-sm font-medium capitalize">
                          {serviceRequest?.schedule?.timeSlot || serviceRequest?.schedule?.preferredTime || 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="border-2 border-sky-100 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Payment Method</h2>
                      <p className="text-sky-100 text-sm">Choose your preferred payment option</p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="p-6 space-y-3">
                  {/* UPI */}
                  <button
                    onClick={() => !processing && setSelectedPaymentMethod('upi')}
                    disabled={processing}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all disabled:opacity-50 ${
                      selectedPaymentMethod === 'upi'
                        ? 'border-sky-500 bg-sky-50 shadow-md'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      selectedPaymentMethod === 'upi' ? 'bg-linear-to-br from-sky-500 to-blue-500' : 'bg-gray-100'
                    }`}>
                      <Smartphone className={`h-6 w-6 ${selectedPaymentMethod === 'upi' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-900">UPI Payment</p>
                      <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                    </div>
                    {selectedPaymentMethod === 'upi' && (
                      <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Credit/Debit Card */}
                  <button
                    onClick={() => !processing && setSelectedPaymentMethod('card')}
                    disabled={processing}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all disabled:opacity-50 ${
                      selectedPaymentMethod === 'card'
                        ? 'border-sky-500 bg-sky-50 shadow-md'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      selectedPaymentMethod === 'card' ? 'bg-linear-to-br from-sky-500 to-blue-500' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`h-6 w-6 ${selectedPaymentMethod === 'card' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-900">Credit / Debit Card</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, RuPay</p>
                    </div>
                    {selectedPaymentMethod === 'card' && (
                      <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Net Banking */}
                  <button
                    onClick={() => !processing && setSelectedPaymentMethod('netbanking')}
                    disabled={processing}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all disabled:opacity-50 ${
                      selectedPaymentMethod === 'netbanking'
                        ? 'border-sky-500 bg-sky-50 shadow-md'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      selectedPaymentMethod === 'netbanking' ? 'bg-linear-to-br from-sky-500 to-blue-500' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`h-6 w-6 ${selectedPaymentMethod === 'netbanking' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-900">Net Banking</p>
                      <p className="text-sm text-gray-600">All major banks supported</p>
                    </div>
                    {selectedPaymentMethod === 'netbanking' && (
                      <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Payment Form Fields */}
                <div className="px-6 pb-6">
                  {/* UPI Form */}
                  {selectedPaymentMethod === 'upi' && (
                    <div className="bg-linear-to-br from-sky-50 to-indigo-50 rounded-2xl p-6 border-2 border-sky-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-linear-to-br from-sky-500 to-blue-500 rounded-lg">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">UPI Payment Details</h3>
                          <p className="text-sm text-gray-600">Enter your UPI ID to proceed</p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="upiId" className="text-sm font-bold text-gray-800 mb-2">
                          UPI ID <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="upiId"
                            type="text"
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="h-12 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl"
                            disabled={processing}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                            @upi
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Your UPI ID is secure and encrypted
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Form */}
                  {selectedPaymentMethod === 'card' && (
                    <div className="bg-linear-to-br from-sky-50 to-indigo-50 rounded-2xl p-6 border-2 border-sky-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-linear-to-br from-sky-500 to-blue-500 rounded-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Card Payment Details</h3>
                          <p className="text-sm text-gray-600">Enter your card information securely</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="cardNumber" className="text-sm font-bold text-gray-800 mb-2">
                            Card Number <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="cardNumber"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '').substring(0, 16);
                                const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                                setCardNumber(formatted);
                              }}
                              className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl"
                              disabled={processing}
                              maxLength={19}
                            />
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cardName" className="text-sm font-bold text-gray-800 mb-2">
                            Cardholder Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cardName"
                            type="text"
                            placeholder="Name as shown on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="h-12 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl"
                            disabled={processing}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry" className="text-sm font-bold text-gray-800 mb-2">
                              Expiry Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="expiry"
                              type="text"
                              placeholder="MM/YY"
                              value={expiryDate}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                                const formatted = value.replace(/(\d{2})(?=\d)/g, '$1/');
                                setExpiryDate(formatted);
                              }}
                              className="h-12 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl"
                              disabled={processing}
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <Label htmlFor="cvv" className="text-sm font-bold text-gray-800 mb-2">
                              CVV <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="cvv"
                                type="password"
                                placeholder="•••"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                className="h-12 pr-10 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl"
                                disabled={processing}
                                maxLength={3}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Lock className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600">Your card details are secured with 256-bit SSL encryption</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking Form */}
                  {selectedPaymentMethod === 'netbanking' && (
                    <div className="bg-linear-to-br from-sky-50 to-indigo-50 rounded-2xl p-6 border-2 border-sky-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-linear-to-br from-sky-500 to-blue-500 rounded-lg">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Net Banking</h3>
                          <p className="text-sm text-gray-600">Select your bank to proceed</p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bank" className="text-sm font-bold text-gray-800 mb-2">
                          Select Bank <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedBank} onValueChange={setSelectedBank} disabled={processing}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-sky-500 text-base rounded-xl" style={{ backgroundColor: 'white' }}>
                            <SelectValue placeholder="Choose your bank" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-sky-200 shadow-lg">
                            <SelectItem value="sbi" className="hover:bg-sky-50 focus:bg-sky-100">State Bank of India</SelectItem>
                            <SelectItem value="hdfc" className="hover:bg-sky-50 focus:bg-sky-100">HDFC Bank</SelectItem>
                            <SelectItem value="icici" className="hover:bg-sky-50 focus:bg-sky-100">ICICI Bank</SelectItem>
                            <SelectItem value="axis" className="hover:bg-sky-50 focus:bg-sky-100">Axis Bank</SelectItem>
                            <SelectItem value="kotak" className="hover:bg-sky-50 focus:bg-sky-100">Kotak Mahindra Bank</SelectItem>
                            <SelectItem value="pnb" className="hover:bg-sky-50 focus:bg-sky-100">Punjab National Bank</SelectItem>
                            <SelectItem value="bob" className="hover:bg-sky-50 focus:bg-sky-100">Bank of Baroda</SelectItem>
                            <SelectItem value="other" className="hover:bg-sky-50 focus:bg-sky-100">Other Bank</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Secure net banking powered by FixBee
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-2 border-sky-100 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Order Summary</h2>
                        <p className="text-sky-100 text-sm">Secure payment</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-700 font-medium">Service Charges</p>
                          <p className="text-xs text-gray-500 mt-1">Final price (service + materials)</p>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">₹{finalPrice}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Taxes (18% GST)</span>
                        <span className="font-semibold text-gray-900">₹{(parseFloat(finalPrice) * 0.18).toFixed(2)}</span>
                      </div>

                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                          <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-sky-600 to-indigo-600 text-2xl">
                            ₹{(parseFloat(finalPrice) * 1.18).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 p-4 bg-linear-to-br from-sky-50 to-indigo-50 rounded-xl border border-sky-100">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>256-bit SSL encryption</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>100% secure payment</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Instant invoice generation</span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Pay ₹{(parseFloat(finalPrice) * 1.18).toFixed(2)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" />
                      Secured by FixBee Payment Gateway
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-14 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-sky-100">
              <CardContent className="p-0">
                <Skeleton className="h-24 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-sky-100">
              <CardContent className="p-0">
                <Skeleton className="h-24 w-full" />
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-2 border-sky-100">
              <CardContent className="p-0">
                <Skeleton className="h-24 w-full" />
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <Skeleton className="h-16 w-full mb-6" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
