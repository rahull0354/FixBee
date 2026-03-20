'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  FileText,
  Sparkles,
  Info,
  Briefcase,
  Loader2,
  Building2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { providerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    console.log('🔍 RequestDetailsPage mounted with requestId:', requestId);

    // First, check if we have the request data from sessionStorage
    const storageKey = `request_${requestId}`;
    const storedRequest = sessionStorage.getItem(storageKey);

    console.log('📦 Checking sessionStorage for key:', storageKey);
    console.log('📦 Found data:', !!storedRequest);

    if (storedRequest) {
      console.log('✅ Using request data from sessionStorage');
      try {
        const storedData = JSON.parse(storedRequest);
        // Extract request data, removing the timestamp field
        const { timestamp, ...requestData } = storedData;
        console.log('📦 Parsed request data:', requestData);
        setRequest(requestData);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error parsing stored request data:', error);
        setLoading(false);
        setRequest(null);
      }
    } else {
      console.log('⚠️ No data in sessionStorage');
      console.log('💡 Please navigate from the Available Requests page');
      setLoading(false);
      setRequest(null);
    }

    // Cleanup old sessionStorage entries (older than 5 minutes)
    return () => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Clear all old request entries
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('request_')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key)!);
            // Only clear if it has a timestamp and is older than 5 minutes
            if (data.timestamp && (now - data.timestamp > fiveMinutes)) {
              console.log('🧹 Clearing old entry:', key);
              sessionStorage.removeItem(key);
            }
          } catch {
            // If we can't parse it, remove it
            sessionStorage.removeItem(key);
          }
        }
      });
    };
  }, [requestId]);

  const handleAcceptRequest = async () => {
    if (!request) return;

    try {
      setAccepting(true);
      await providerApi.acceptRequest(requestId);
      toast.success('Request accepted successfully!');

      // Redirect to assignments page
      router.push('/provider/assignments');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error?.response?.data?.message || 'Failed to accept request');
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-emerald-100 text-center">
        <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Not Found</h2>
        <p className="text-gray-600 mb-6">
          Unable to load request details. Please navigate from the Available Requests page.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/provider/requests/available')} className="bg-emerald-600 hover:bg-emerald-700">
            Go to Available Requests
          </Button>
        </div>
      </div>
    );
  }

  const pricingDetails = (request.pricingDetails as any) || {};
  const hasNewPricing = pricingDetails.providerCharge !== undefined;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/provider/requests/available')}
        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Available Requests
      </button>

      {/* Status Banner - Keep as is */}
      <div className="rounded-2xl p-6 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Service Request</h2>
              <p className="text-sm text-emerald-100">
                A customer is waiting for your service
              </p>
            </div>
          </div>
          <div className="text-sm font-mono px-4 py-2 rounded-lg bg-white/20 border-2 border-white/30">
            <span className="text-xs opacity-75">Request ID: </span>
            {request.id}
          </div>
        </div>
      </div>

      {/* Main Content - New Design */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {/* Left Column - 8 cols */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-1">
          {/* Service Title Card */}
          <div className="bg-linear-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-linear-to-br from-emerald-400 to-teal-400 rounded-xl shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h1>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    {request.category?.name || request.serviceType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Service Description</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-base">{request.description}</p>

            {request.additionalNotes && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm mb-1">Additional Notes</p>
                    <p className="text-amber-800 text-sm">{request.additionalNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {request.beforeImages && request.beforeImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600 mb-3">Before Images</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {request.beforeImages.map((image, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-xl border border-gray-200">
                      <img
                        src={image}
                        alt={`Before ${index + 1}`}
                        className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Schedule & Location</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Date</p>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900">{formatDate(request.scheduledDate)}</p>
              </div>

              {/* Time */}
              <div className="bg-linear-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Time Slot</p>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                  {request.scheduledTimeSlot || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Service Address</p>
                  <p className="text-base font-semibold text-gray-900 leading-relaxed">
                    {(request.address as any).street && `${(request.address as any).street}, `}
                    {(request.address as any).city}
                    {(request.address as any).state && `, ${(request.address as any).state}`}
                    {(request.address as any).pinCode && ` - ${(request.address as any).pinCode}`}
                  </p>
                  {(request.address as any).landmarks && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Landmarks:</span> {(request.address as any).landmarks}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 4 cols - Sticky */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-2">
          <div className="sticky top-6 space-y-6">
            {/* Customer Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-linear-to-br from-purple-400 to-pink-400 rounded-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Customer</h3>
              </div>

              {request.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</p>
                    <p className="text-base font-semibold text-gray-900">{request.customer.name}</p>
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Contact Protected</p>
                        <p className="leading-relaxed">
                          Customer contact details will be shared after you accept the request to protect privacy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Customer information not available</p>
              )}
            </div>

            {/* Checklist Card */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900">Before Accepting</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Verify you can serve this location</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Check the pricing breakdown below</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Review the service description</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Confirm your availability</span>
                </li>
              </ul>
            </div>

            {/* Pricing Card */}
            <div className="bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-linear-to-br from-emerald-400 to-teal-400 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pricing</h3>
              </div>

              {hasNewPricing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                    <span className="text-sm font-medium text-gray-700">You Earn</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatPrice(pricingDetails.providerCharge)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                    <span className="text-sm font-medium text-gray-700">Platform Fee</span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(pricingDetails.adminCharge)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl px-4 -mx-2">
                    <span className="text-sm font-semibold text-white">Total</span>
                    <span className="text-xl font-bold text-white">
                      {formatPrice(pricingDetails.total || request.estimatedPrice || 0)}
                    </span>
                  </div>

                  {pricingDetails.additionalBreakdown && (
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {pricingDetails.additionalBreakdown}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                    <span className="text-sm font-medium text-gray-700">Est. Price</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatPrice(request.estimatedPrice || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    * Final price may vary based on actual work.
                  </p>
                </div>
              )}
            </div>

            {/* Accept Button - Desktop only */}
            <Button
              onClick={handleAcceptRequest}
              disabled={accepting}
              className="hidden lg:flex w-full bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold py-6 text-base shadow-xl shadow-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02]"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Accept This Request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Accept Button - Full width on mobile, normal on desktop */}
      <div className="order-3 lg:order-last lg:hidden sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10 shadow-lg">
        <Button
          onClick={handleAcceptRequest}
          disabled={accepting}
          className="w-full bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold py-6 text-base shadow-xl shadow-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02]"
        >
          {accepting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Accept This Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
