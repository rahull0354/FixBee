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

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule dialog
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  useEffect(() => {
    if (id) {
      loadRequest();
      loadReviews();
    }
  }, [id]);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await customerApi.getMyReviews();

      console.log('[Request Details] Reviews API Response:', response);

      // Handle different response formats
      let reviewsData: any[] = [];
      if (Array.isArray(response)) {
        reviewsData = response;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        reviewsData = (response as any).data;
      } else if ((response as any).reviews && Array.isArray((response as any).reviews)) {
        reviewsData = (response as any).reviews;
      }

      console.log('[Request Details] Parsed reviews:', reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadRequest = async () => {
    try {
      setLoading(true);

      console.log('[Request Details] Fetching request with ID:', id);

      const response = await customerApi.getServiceRequest(id);

      console.log('[Request Details] API Response:', response);

      // Backend returns: { request: {...}, timing: {...}, status: {...}, ... }
      const responseObj = (response as any).data || response;
      const rawRequest = responseObj.request || responseObj;

      console.log('[Request Details] Raw request data:', rawRequest);

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
        createdAt: rawRequest.createdAt,
        updatedAt: rawRequest.updatedAt,
      };

      console.log('[Request Details] Mapped data:', data);

      setRequest(data);

      // Fetch provider details if assigned
      if (rawRequest.serviceProviderId) {
        try {
          console.log('[Request Details] Fetching provider:', rawRequest.serviceProviderId);
          const providerResponse = await customerApi.getProvider(rawRequest.serviceProviderId);
          const providerData = (providerResponse as any).data || providerResponse;
          console.log('[Request Details] Provider data:', providerData);
          console.log('[Request Details] Provider fields:', Object.keys(providerData));

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

          console.log('[Request Details] Completed jobs count:', completedJobsCount);

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
      setNewTimeSlot(data.scheduledTimeSlot);
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
        scheduledDate: newDate,
        scheduledTimeSlot: newTimeSlot,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading request details...</p>
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
        className={`rounded-2xl p-6 ${
          request.status === 'completed'
            ? 'bg-green-50 border border-green-200'
            : request.status === 'cancelled'
            ? 'bg-red-50 border border-red-200'
            : 'bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              request.status === 'completed'
                ? 'bg-green-100'
                : request.status === 'cancelled'
                ? 'bg-red-100'
                : 'bg-white/20'
            }`}>
              {getStatusIcon(request.status)}
            </div>
            <div>
              <h2 className="text-xl font-bold">Request {formatStatusText(request.status)}</h2>
              <p className={`text-sm ${
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
            <div className={`text-sm font-mono px-4 py-2 rounded-lg border-2 ${
              request.status === 'completed'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}>
              <span className="text-xs opacity-75">Request ID: </span>
              {request.id}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        {/* Left: Service Details & Address */}
        <div className="lg:w-1/2 space-y-6">
          {/* Service Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-sky-600" />
              Service Details
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Title</p>
                <p className="text-lg font-semibold text-gray-800">{request.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="text-gray-800">{request.serviceType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-800">{request.description}</p>
              </div>

              {request.finalPrice && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Final Price</p>
                  <p className="text-2xl font-bold text-emerald-600">${request.finalPrice}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
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
                  <p className="text-gray-800 font-medium">{request.address?.street || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">City</p>
                  <p className="text-gray-800 font-medium">{request.address?.city || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">State & ZIP</p>
                  <p className="text-gray-800 font-medium">
                    {request.address?.state || 'N/A'}
                    {request.address?.zipCode && ` ${request.address.zipCode}`}
                  </p>
                </div>
              </div>

              {request.address?.country && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Country</p>
                    <p className="text-gray-800 font-medium">{request.address.country}</p>
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
            <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-sky-600" />
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

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Actions</h3>

            <div className="space-y-3">
              {canReschedule && (
                <Button
                  onClick={() => setRescheduleDialogOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
              )}

              {canCancel && (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Request
                </Button>
              )}

              {request.status === 'completed' && (
                (() => {
                  if (reviewsLoading) {
                    return (
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    );
                  }

                  const requestReview = reviews.find(review => review.requestId === request.id || review.serviceRequestId === request.id);

                  if (requestReview) {
                    return (
                      <div className="p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-gray-800">Your Review</span>
                          </div>
                          <Link
                            href={`/customer/reviews`}
                            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (requestReview.rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-gray-200 text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {requestReview.comment && (
                          <p className="text-sm text-gray-700 line-clamp-2 italic">
                            "{requestReview.comment}"
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <p className="text-xs text-gray-500">
                            Reviewed on {requestReview.createdAt ? new Date(requestReview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link href={`/customer/reviews/create?requestId=${request.id}`}>
                      <Button
                        className="w-full bg-linear-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-500 hover:via-yellow-500 hover:to-orange-500 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Star className="mr-2 h-4 w-4 fill-yellow-200" />
                        Write a Review
                      </Button>
                    </Link>
                  );
                })()
              )}

              {request.status === 'cancelled' && (
                <div className="text-center text-sm text-gray-500">
                  <p>This request has been cancelled.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Provider, Schedule & Actions */}
        <div className="lg:w-1/2 space-y-6">
          {/* Schedule */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
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
                  <p className="text-lg font-semibold text-gray-800">
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
              <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h3 className="text-lg font-bold">Service Provider</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30">
                      <span className="text-3xl font-bold">
                        {provider.name?.charAt(0).toUpperCase() || 'P'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold">{provider.name || 'Service Provider'}</p>
                      {provider.averageRating && (
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(typeof provider.averageRating === 'number' ? provider.averageRating : parseFloat(provider.averageRating || '0'))
                                  ? 'fill-yellow-300 text-yellow-300'
                                  : 'fill-white/30 text-white/30'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-sky-100">
                            {typeof provider.averageRating === 'number' ? provider.averageRating.toFixed(1) : parseFloat(provider.averageRating || '0').toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Details */}
              <div className="p-6 space-y-4">
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
                    <p className="text-sm text-gray-600 line-clamp-3">{provider.bio}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (request.status === 'assigned' || request.status === 'in-progress' || request.status === 'completed') ? (
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h3 className="text-lg font-bold">Service Provider</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">Assigned</p>
                      <p className="text-sm text-sky-100">Provider is on the way</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-800 font-semibold">Service provider has been assigned</p>
                  <p className="text-sm text-gray-500 mt-1">They will contact you shortly</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Service Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this service request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for cancellation *</Label>
              <Textarea
                id="cancelReason"
                rows={4}
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Request
            </Button>
            <Button
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Service</DialogTitle>
            <DialogDescription>
              Choose a new date and time slot for your service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newDate">New Date *</Label>
              <Input
                id="newDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            <div>
              <Label>New Time Slot *</Label>
              <div className="space-y-2 mt-2">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      newTimeSlot === slot.value
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={slot.value}
                      checked={newTimeSlot === slot.value}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                    />
                    <span className="text-sm">{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
