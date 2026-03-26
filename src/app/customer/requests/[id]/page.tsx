'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Star,
  Phone,
  Mail,
  Edit,
  X,
  Image as ImageIcon,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  CreditCard,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  DayPicker,
  useNavigation,
} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule dialog
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequest();
      loadReviews();
    }
  }, [id]);

  // Load invoice only when payment is already completed
  useEffect(() => {
    if (request?.paymentStatus === 'paid' && request?.id) {
      loadInvoice();
    }
  }, [request?.paymentStatus, request?.id]);

  // Reload reviews when page becomes visible (e.g., navigating back from reviews list)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        console.log('[Request Details] Page visible, reloading reviews...');
        loadReviews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      console.log('[Request Details] Loading reviews for request:', id);

      const response = await customerApi.getMyReviews();
      console.log('[Request Details] Reviews API response:', response);

      // Handle different response formats
      let reviewsData: any[] = [];
      if (Array.isArray(response)) {
        reviewsData = response;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        reviewsData = (response as any).data;
      } else if ((response as any).reviews && Array.isArray((response as any).reviews)) {
        reviewsData = (response as any).reviews;
      }

      // Filter out any invalid reviews
      const validReviews = reviewsData.filter(review => review && review.id);

      console.log('[Request Details] Valid reviews loaded:', validReviews.length);
      console.log('[Request Details] Review IDs:', validReviews.map(r => r.id));

      setReviews(validReviews);
    } catch (error) {
      console.error('[Request Details] Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadInvoice = async () => {
    try {
      setLoadingInvoice(true);
      const response = await customerApi.getInvoiceByRequest(id);
      const apiData = (response as any).data || response;
      setInvoice(apiData);
    } catch (error: any) {
      // Invoice doesn't exist - this is okay for services completed before payment integration
      // Silently handle 404 errors for old completed services
      if (error?.response?.status === 404) {
        console.log('[Request Details] No invoice found for this request (old completed service)');
        setInvoice(null);
      } else {
        // Only log other errors
        console.error('[Request Details] Error loading invoice:', error?.response?.data?.message || error.message);
        setInvoice(null);
      }
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadRequest = async () => {
    try {
      setLoading(true);

      const response = await customerApi.getServiceRequest(id);

      // Backend returns: { request: {...}, timing: {...}, status: {...}, ... }
      const responseObj = (response as any).data || response;
      const rawRequest = responseObj.request || responseObj;

      // Check if we got valid data
      if (!rawRequest || typeof rawRequest !== 'object') {
        throw new Error('Invalid response from server');
      }

      // Map backend data to ServiceRequest type
      const data: ServiceRequest = {
        id: rawRequest.id,
        customerId: rawRequest.customerId,
        providerId: rawRequest.serviceProviderId,
        categoryId: rawRequest.serviceCategoryId,
        serviceType: rawRequest.serviceType,
        title: rawRequest.serviceTitle || rawRequest.title || 'Service Request',
        description: rawRequest.serviceDescription || rawRequest.description || '',
        address: rawRequest.serviceAddress || rawRequest.address || {},
        scheduledDate: rawRequest.schedule?.date || rawRequest.createdAt,
        scheduledTimeSlot: rawRequest.schedule?.timeSlot || rawRequest.timeSlot || 'morning',
        status: rawRequest.status === 'requested' ? 'pending' : rawRequest.status,
        estimatedPrice: rawRequest.estimatedPrice ? parseFloat(rawRequest.estimatedPrice) : undefined,
        finalPrice: rawRequest.finalPrice && rawRequest.finalPrice !== "0.00" ? parseFloat(rawRequest.finalPrice) : undefined,
        beforeImages: rawRequest.beforeImages || [],
        afterImages: rawRequest.afterImages || [],
        additionalNotes: rawRequest.additionalNotes || rawRequest.notes || '',
        createdAt: rawRequest.createdAt,
        updatedAt: rawRequest.updatedAt,
      };

      setRequest(data);

      // Fetch provider details if assigned
      if (rawRequest.serviceProviderId) {
        try {
          const providerResponse = await customerApi.getProvider(rawRequest.serviceProviderId);
          const providerData = (providerResponse as any).data || providerResponse;

          // Check various possible field names for completed jobs
          const completedJobsCount =
            providerData.completedJobs ||
            providerData.jobsCompleted ||
            providerData.totalJobs ||
            providerData.completedServices ||
            providerData.serviceCount ||
            providerData.jobsDone ||
            providerData.totalCompleted ||
            0;

          setProvider({ ...providerData, completedJobs: completedJobsCount });
        } catch (providerError) {
          console.warn('[Request Details] Failed to fetch provider:', providerError);
          // Continue even if provider fetch fails - show placeholder
        }
      }

      // Pre-fill reschedule form with current values
      if (data.scheduledDate) {
        setNewDate(new Date(data.scheduledDate).toISOString().split('T')[0]);
      }
      setNewTimeSlot(data.scheduledTimeSlot || 'morning');
    } catch (error: any) {
      console.error('[Request Details] Error loading request:', error);

      // Show more detailed error info
      const errorMessage = error?.response?.data?.message || error?.response?.data || error?.message || 'Failed to load request details';
      const status = error?.response?.status;

      console.error('[Request Details] Error status:', status);
      console.error('[Request Details] Error data:', error?.response?.data);

      toast.error(`${errorMessage}${status ? ` (Status: ${status})` : ''}`);
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setActionLoading(true);
      await customerApi.cancelServiceRequest(id, cancelReason);
      toast.success('Request cancelled successfully');
      setCancelDialogOpen(false);
      loadRequest(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to cancel request';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTimeSlot) {
      toast.error('Please select both date and time slot');
      return;
    }

    try {
      setActionLoading(true);
      await customerApi.rescheduleServiceRequest(id, {
        schedule: {
          date: newDate,
          timeSlot: newTimeSlot,
        },
      });
      toast.success('Request rescheduled successfully');
      setRescheduleDialogOpen(false);
      loadRequest(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error rescheduling request:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to reschedule request';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Not scheduled';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Invalid Date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'assigned':
        return <User className="h-5 w-5" />;
      case 'in-progress':
        return <Briefcase className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const formatStatusText = (status: string | any) => {
    const statusStr = String(status || 'unknown');
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
  };

  const timeSlots = [
    { value: 'morning', label: 'Morning (8AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
    { value: 'evening', label: 'Evening (5PM - 8PM)' },
  ];

  const canCancel = request?.status === 'pending' || request?.status === 'assigned';
  const canReschedule = request?.status === 'pending' || request?.status === 'assigned';

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-24" />

        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* Status Timeline Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Info Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* Details Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
        <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Not Found</h2>
        <p className="text-gray-600 mb-6">The service request you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </button>

      {/* Status Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-6 ${
          request.status === 'completed'
            ? 'bg-green-50 border border-green-200'
            : request.status === 'cancelled'
            ? 'bg-red-50 border border-red-200'
            : 'bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-xl ${
              request.status === 'completed'
                ? 'bg-green-100'
                : request.status === 'cancelled'
                ? 'bg-red-100'
                : 'bg-white/20'
            }`}>
              {getStatusIcon(request.status)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold">Request {formatStatusText(request.status)}</h2>
              <p className={`text-xs sm:text-sm ${
                request.status === 'completed'
                  ? 'text-green-700'
                  : request.status === 'cancelled'
                  ? 'text-red-700'
                  : 'text-sky-100'
              }`}>
                {request.status === 'completed'
                  ? 'This service has been completed'
                  : request.status === 'cancelled'
                  ? 'This request has been cancelled'
                  : 'Your service request is being processed'}
              </p>
            </div>
          </div>
          {(request.status === 'completed' || request.status === 'cancelled') && (
            <div className={`text-xs sm:text-sm font-mono px-3 sm:px-4 py-2 rounded-lg border-2 ${
              request.status === 'completed'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}>
              <span className="text-xs opacity-75">ID: </span>
              <span className="hidden sm:inline">Request ID: </span>
              {request.id.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
        {/* Left: Service Details & Address - Order 2 on desktop, 1 on mobile */}
        <div className="lg:w-1/2 space-y-4 lg:space-y-6 order-2 lg:order-1">
          {/* Service Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-sky-600" />
              Service Details
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Title</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">{request.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="text-gray-800 capitalize">{request.serviceType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-800 capitalize">{request.description}</p>
              </div>

              {request.additionalNotes && request.additionalNotes.trim() !== '' && (
                <div className="mt-6 p-4 bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📝</span>
                    <p className="text-sm font-bold text-amber-800">Additional Notes</p>
                  </div>
                  <p className="text-sm text-amber-900 capitalize leading-relaxed">"{request.additionalNotes}"</p>
                </div>
              )}

              {request.finalPrice && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Final Price</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{request.finalPrice}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-600" />
              Service Address
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Street Address</p>
                  <p className="text-gray-800 font-medium capitalize">{request.address?.street || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">City</p>
                  <p className="text-gray-800 font-medium capitalize">{request.address?.city || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">State</p>
                  <p className="text-gray-800 font-medium capitalize">{request.address?.state || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">ZIP Code</p>
                  <p className="text-gray-800 font-medium">{request.address?.zipCode || request.address?.pincode || 'N/A'}</p>
                </div>
              </div>

              {request.address?.country && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Country</p>
                    <p className="text-gray-800 font-medium capitalize">{request.address.country}</p>
                  </div>
                </div>
              )}

              {request.status !== 'completed' && request.status !== 'cancelled' && (
                <div className="mt-6 p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">Service Location Confirmed</p>
                  </div>
                  <p className="text-xs text-emerald-700">
                    The service provider will visit this address to complete the service.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* After Images (if completed) */}
          {request.status === 'completed' && request.afterImages && request.afterImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                After Service Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.afterImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`After photo ${index + 1}`}
                    className="w-full h-40 object-cover rounded-xl border border-sky-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions Section - Only for Completed Requests */}
          {request.status === 'completed' && (
            <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Request Actions</h3>
                  <p className="text-sky-100 text-xs">Manage your completed service</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Payment Actions */}
                {request.status === 'completed' && (
                  <>
                    {loadingInvoice ? (
                      <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <p className="text-sm text-sky-100">Loading payment information...</p>
                      </div>
                    ) : request.paymentStatus === 'paid' ? (
                      <button
                        onClick={() => invoice && router.push(`/customer/payments/invoices/${invoice.id}`)}
                        className="w-full flex items-center gap-4 p-4 bg-linear-to-br from-blue-400/20 to-indigo-400/20 backdrop-blur-sm rounded-xl border-2 border-blue-300/30 hover:from-blue-400/30 hover:to-indigo-400/30 hover:scale-[1.02] transition-all"
                      >
                        <div className="p-3 bg-blue-400/30 rounded-xl">
                          <CheckCircle className="h-6 w-6 text-blue-200" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-base">View Receipt</p>
                          <p className="text-xs text-blue-100">Payment completed successfully</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-blue-200" />
                      </button>
                    ) : request.paymentStatus === 'failed' ? (
                      <div className="w-full flex items-center gap-4 p-4 bg-red-400/10 backdrop-blur-sm rounded-xl border-2 border-red-300/20">
                        <div className="p-3 bg-red-400/20 rounded-xl">
                          <XCircle className="h-6 w-6 text-red-300" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-base">Payment Failed</p>
                          <p className="text-xs text-red-200">Please try again or contact support</p>
                        </div>
                      </div>
                    ) : request.paymentStatus === 'refunded' ? (
                      <div className="w-full flex items-center gap-4 p-4 bg-amber-400/10 backdrop-blur-sm rounded-xl border-2 border-amber-300/20">
                        <div className="p-3 bg-amber-400/20 rounded-xl">
                          <FileText className="h-6 w-6 text-amber-300" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-base">Payment Refunded</p>
                          <p className="text-xs text-amber-200">Your payment has been refunded</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => router.push(`/customer/payments/checkout/${request?.id}`)}
                        className="w-full flex items-center gap-4 p-4 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl border-2 border-emerald-400/30 transition-all"
                      >
                        <div className="p-3 bg-white/20 rounded-xl">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-base text-white">Complete Payment</p>
                          <p className="text-xs text-emerald-100">
                            {request?.finalPrice || request?.estimatedPrice
                              ? `Pay ₹${parseFloat(String(request.finalPrice || request.estimatedPrice || '0')).toFixed(2)}`
                              : 'Complete your payment for this service'
                            }
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-white" />
                      </button>
                    )}
                  </>
                )}

                {/* Review Actions */}
                {(() => {
                  if (reviewsLoading) {
                    return (
                      <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <p className="text-sm text-sky-100">Loading review information...</p>
                      </div>
                    );
                  }

                  // Find the review for this specific request
                  const requestReview = reviews.find(review =>
                    review.requestId === request.id || review.serviceRequestId === request.id
                  );

                  console.log('[Request Details] Found review for request:', requestReview ? requestReview.id : 'none');

                  if (requestReview) {
                    return (
                      <Link
                        href={`/customer/reviews/${requestReview.id}/edit`}
                        className="block"
                      >
                        <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all">
                          <div className="p-3 bg-amber-400/20 rounded-xl">
                            <Star className="h-6 w-6 text-amber-300 fill-amber-300" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-base">Your Review</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${
                                      i < requestReview.rating
                                        ? 'fill-amber-300 text-amber-300'
                                        : 'fill-white/30 text-white/30'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-sky-100 line-clamp-1">{requestReview.comment}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-white">
                            View Full Details
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      href={`/customer/reviews/create?requestId=${request.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-4 p-4 bg-linear-to-br from-amber-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl border-2 border-amber-300/30 hover:from-amber-400/30 hover:to-orange-400/30 hover:scale-[1.02] transition-all">
                        <div className="p-3 bg-amber-400/30 rounded-xl">
                          <Star className="h-6 w-6 text-amber-200 fill-amber-200" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base">Write a Review</p>
                          <p className="text-xs text-amber-100">Rate your service experience</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-amber-200" />
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Right: Schedule, Provider & Actions - Order 1 on mobile, 2 on desktop */}
        <div className="lg:w-1/2 space-y-4 lg:space-y-6 order-1 lg:order-2">
          {/* Schedule */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
              Schedule
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold text-gray-800">{formatDate(request.scheduledDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <Clock className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Time Slot</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatStatusText(request.scheduledTimeSlot)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatStatusText(request.status)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="text-lg font-semibold text-gray-800 capitalize">
                    {request.serviceType}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Request ID:</span> {request.id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Created on:</span> {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Info */}
          {provider ? (
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 p-4 sm:p-6 pb-6 sm:pb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h3 className="text-base sm:text-lg font-bold">Service Provider</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30 shrink-0">
                      <span className="text-2xl sm:text-3xl font-bold">
                        {provider.name?.charAt(0).toUpperCase() || 'P'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <p className="text-base sm:text-xl font-bold wrap-break-word">{provider.name || 'Service Provider'}</p>
                      {provider.averageRating && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                i < Math.floor(typeof provider.averageRating === 'number' ? provider.averageRating : parseFloat(provider.averageRating || '0'))
                                  ? 'fill-yellow-300 text-yellow-300'
                                  : 'fill-white/30 text-white/30'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xs sm:text-sm text-sky-100">
                            {typeof provider.averageRating === 'number' ? provider.averageRating.toFixed(1) : parseFloat(provider.averageRating || '0').toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Details */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100">
                    <Mail className="h-5 w-5 text-sky-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{provider.email || 'Contact'}</p>
                    </div>
                  </div>

                  {provider.phone && (
                    <div className="flex items-center gap-3 p-3 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{provider.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {provider.skills && provider.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills.slice(0, 4).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-linear-to-r from-violet-100 to-purple-100 text-violet-700 text-sm font-medium rounded-full border border-violet-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {provider.skills.length > 4 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                          +{provider.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-center">
                    <Briefcase className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">{provider.totalJobsCompleted || provider.completedJobs || 0}</p>
                    <p className="text-xs text-gray-600">Jobs Done</p>
                  </div>
                  <div className="p-3 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                    <Star className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">
                      {typeof provider.averageRating === 'number' ? provider.averageRating.toFixed(1) : parseFloat(provider.averageRating || '0').toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">About</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap wrap-break-word">{provider.bio}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed') ? (
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 p-4 sm:p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h3 className="text-base sm:text-lg font-bold">Service Provider</h3>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30 shrink-0">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold">Assigned</p>
                      <p className="text-xs sm:text-sm text-sky-100">Provider is on the way</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-3 sm:py-4">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base font-semibold text-gray-800">Service provider has been assigned</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">They will contact you shortly</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-125 w-[95vw] max-w-[95vw] p-0 overflow-hidden bg-white">
          {/* Header with Warning Gradient */}
          <div className="bg-linear-to-r from-red-500 via-orange-500 to-amber-500 px-4 sm:px-6 py-4 sm:py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                Cancel Service Request
              </DialogTitle>
              <DialogDescription className="text-red-100 text-sm sm:text-base">
                This action cannot be undone. Please provide a reason for cancellation.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Warning Alert */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 bg-amber-200 rounded-lg shrink-0">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-amber-800 mb-1">Important Notice</p>
                  <p className="text-xs sm:text-sm text-amber-700">
                    Once cancelled, this request cannot be recovered. You'll need to create a new request if you change your mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="cancelReason" className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Reason for cancellation *
              </Label>
              <Textarea
                id="cancelReason"
                rows={4}
                placeholder="Please let us know why you're cancelling. This helps us improve our service..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-sm sm:text-base border-gray-300 focus:border-red-400 focus:ring-red-400"
              />
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Required:</span> Please provide at least a brief explanation
              </p>
            </div>

            {/* Request Info Summary */}
            {request && (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 sm:mb-2">Request to be cancelled:</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">{request.title}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Scheduled: {new Date(request.scheduledDate || new Date()).toLocaleDateString()} at {request.scheduledTimeSlot || 'Not specified'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={actionLoading}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold border-2 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Keep Request
              </Button>
              <Button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold bg-linear-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-125 w-[95vw] max-w-[95vw] p-0 overflow-hidden bg-white">
          {/* Header with Gradient */}
          <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 sm:px-6 py-4 sm:py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Reschedule Service
              </DialogTitle>
              <DialogDescription className="text-sky-100 text-sm sm:text-base">
                Choose a new date and time for your service appointment
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Date Selection */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                New Date *
              </Label>

              {/* Custom Calendar Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm sm:text-base bg-white border-2 border-sky-300 rounded-xl hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                >
                  <span className={newDate ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                    {newDate ? format(new Date(newDate), 'MMMM d, yyyy') : 'Select a date'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-sky-600 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCalendarOpen && (
                  <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-sky-200">
                    <style>{`
                      .rdp-custom .rdp-nav_button {
                        transition: all 0.2s;
                      }
                      .rdp-custom .rdp-nav_button:hover {
                        background-color: #e0f2fe;
                        border-radius: 4px;
                      }
                      .rdp-custom .rdp-day {
                        cursor: pointer;
                        transition: all 0.2s;
                      }
                      .rdp-custom .rdp-day:hover:not(.rdp-day_disabled) {
                        background-color: #e0f2fe;
                        border-radius: 8px;
                      }
                      .rdp-custom .rdp-head_cell {
                        font-weight: 600;
                      }
                    `}</style>
                    <DayPicker
                      mode="single"
                      selected={newDate ? new Date(newDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setNewDate(format(date, 'yyyy-MM-dd'));
                          setIsCalendarOpen(false);
                        }
                      }}
                      disabled={{ before: new Date() }}
                      className="rdp-custom"
                      styles={{
                        root: { margin: 0 },
                        head_cell: { color: '#0ea5e9' },
                        head_row: { marginBottom: '8px' },
                        cell: {
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          height: '36px',
                          width: '36px',
                        },
                        day: {
                          color: '#1e293b',
                          fontWeight: '500',
                        },
                        day_disabled: {
                          color: '#cbd5e1',
                        },
                        day_selected: {
                          backgroundColor: '#0ea5e9',
                          color: '#ffffff',
                          fontWeight: 'bold',
                        },
                        day_today: {
                          borderColor: '#f59e0b',
                          borderWidth: '2px',
                        },
                        nav_button: {
                          color: '#0ea5e9',
                          fontWeight: 'bold',
                        },
                        caption: {
                          color: '#1e293b',
                          fontWeight: 'bold',
                        },
                        month_caption: {
                          color: '#1e293b',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                        },
                        weekday: {
                          color: '#64748b',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                {newDate
                  ? `Selected: ${format(new Date(newDate), 'EEEE, MMMM d, yyyy')}`
                  : `Select a date from ${format(new Date(), 'MMMM d, yyyy')} onwards`
                }
              </p>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                New Time Slot *
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.value}
                    className={`relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newTimeSlot === slot.value
                        ? 'border-sky-500 bg-linear-to-br from-sky-50 to-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-sky-300 bg-white hover:bg-sky-50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={slot.value}
                      checked={newTimeSlot === slot.value}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      newTimeSlot === slot.value ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
                    }`}>
                      {newTimeSlot === slot.value && (
                        <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800">{slot.label.split(' (')[0]}</p>
                      <p className="text-xs text-gray-500">{slot.label.match(/\(([^)]+)\)/)?.[1]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
                disabled={actionLoading}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold border-2 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={actionLoading}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Update Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
