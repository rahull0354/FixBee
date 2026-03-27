'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Image as ImageIcon,
  IndianRupee,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { providerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);

  // Complete service dialog state
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [materialCost, setMaterialCost] = useState<string>('');
  const [materialDescription, setMaterialDescription] = useState<string>('');

  const fetchCustomerData = useCallback(async (customerId: string, requestData: any) => {
    try {
      setFetchingCustomer(true);

      const customerResponse = await providerApi.getCustomerById(customerId);
      const customerInfo = (customerResponse as any).data || customerResponse;

      if (!customerInfo || !customerInfo.id) {
        throw new Error('Invalid customer data received from API');
      }

      const updatedRequest = {
        ...requestData,
        customer: {
          id: customerInfo.id,
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
        }
      };

      console.log('📋 Updated Request Data:', JSON.stringify(updatedRequest, null, 2));
      console.log('💰 Pricing Details:');
      console.log('  - Final Price:', updatedRequest.finalPrice);
      console.log('  - Material Cost:', updatedRequest.materialCost);
      console.log('  - Material Description:', updatedRequest.materialDescription);

      setRequest(updatedRequest);

      // Update sessionStorage with fetched customer data
      const storageKey = `assignment_${requestId}`;
      sessionStorage.setItem(storageKey, JSON.stringify({
        ...updatedRequest,
        timestamp: Date.now(),
      }));
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer information');
    } finally {
      setFetchingCustomer(false);
    }
  }, [requestId]);

  useEffect(() => {
    // First, check if we have the request data from sessionStorage
    const storageKey = `assignment_${requestId}`;
    const storedRequest = sessionStorage.getItem(storageKey);

    if (storedRequest) {
      try {
        const storedData = JSON.parse(storedRequest);
        // Extract request data, removing the timestamp field
        const { timestamp, ...requestData } = storedData;

        setRequest(requestData);
        setLoading(false);

        // If customer data is missing, fetch it
        if (!requestData.customer && requestData.customerId) {
          fetchCustomerData(requestData.customerId, requestData);
        }

        // Set initial final price from estimated price
        if (requestData.estimatedPrice) {
          setFinalPrice(requestData.estimatedPrice.toString());
        }

        console.log('📋 Loaded Request from Storage:', JSON.stringify(requestData, null, 2));
        console.log('💰 Pricing Details:');
        console.log('  - Status:', requestData.status);
        console.log('  - Estimated Price:', requestData.estimatedPrice);
        console.log('  - Final Price:', requestData.finalPrice);
        console.log('  - Material Cost:', requestData.materialCost);
        console.log('  - Material Description:', requestData.materialDescription);
        console.log('  - pricingDetails object:', JSON.stringify(requestData.pricingDetails, null, 2));
        console.log('  - All request keys:', Object.keys(requestData));
        console.log('  - Complete request object:', JSON.stringify(requestData, null, 2));
      } catch (error) {
        console.error('❌ Error parsing stored request data:', error);
        setLoading(false);
        setRequest(null);
      }
    } else {
      setLoading(false);
      setRequest(null);
    }

    // Cleanup old sessionStorage entries (older than 5 minutes)
    return () => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Clear all old assignment entries
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('assignment_')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key)!);
            // Only clear if it has a timestamp and is older than 5 minutes
            if (data.timestamp && (now - data.timestamp > fiveMinutes)) {
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

  const handleStartService = async () => {
    if (!request) return;

    try {
      setActionLoading(true);
      await providerApi.startService(requestId);
      toast.success('Service started successfully!');

      // Update local state
      setRequest({ ...request, status: 'in_progress' as any });

      // Redirect back to assignments after a short delay
      setTimeout(() => {
        router.push('/provider/assignments');
      }, 1000);
    } catch (error: any) {
      console.error('Error starting service:', error);
      toast.error(error?.response?.data?.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!finalPrice || Number(finalPrice) <= 0) {
      toast.error('Please enter a valid final price');
      return;
    }

    // If material cost is provided, description is required
    if (materialCost && Number(materialCost) > 0 && !materialDescription.trim()) {
      toast.error('Please describe the materials purchased');
      return;
    }

    try {
      setActionLoading(true);

      const completionData = {
        afterImages: afterImages.length > 0 ? afterImages : undefined,
        finalPrice: Number(finalPrice),
        materialCost: materialCost && Number(materialCost) > 0 ? Number(materialCost) : undefined,
        materialDescription: materialCost && Number(materialCost) > 0 ? materialDescription : undefined,
      };

      console.log('📤 Sending completion data:', JSON.stringify(completionData, null, 2));

      await providerApi.completeService(requestId, completionData);

      console.log('✅ Service completion API call successful');

      // Clear the cached sessionStorage data so next load will fetch fresh from DB
      const storageKey = `assignment_${requestId}`;
      sessionStorage.removeItem(storageKey);
      console.log('🗑️ Cleared cached data - will fetch fresh from database on next visit');

      toast.success('Service completed successfully!');
      setShowCompleteDialog(false);

      // Redirect back to assignments after a short delay
      setTimeout(() => {
        router.push('/provider/assignments');
      }, 1000);
    } catch (error: any) {
      console.error('Error completing service:', error);
      toast.error(error?.response?.data?.message || 'Failed to complete service');
    } finally {
      setActionLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setAfterImages([...afterImages, url]);
    }
  };

  const removeImageUrl = (index: number) => {
    setAfterImages(afterImages.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'assigned':
        return 'Assigned';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-48" />

        {/* Banner Skeleton */}
        <div className="h-32 rounded-2xl bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400" />

        {/* Service Title Card Skeleton */}
        <div className="h-24 rounded-2xl border border-emerald-200" />

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-emerald-100">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Skeleton */}
        <Card className="border-emerald-100">
          <CardContent className="p-6">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Assignment Not Found</h2>
        <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/provider/assignments')}
        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Assignments
      </button>

      {/* Status Banner */}
      <div
        className={`rounded-2xl p-6 text-white shadow-lg ${
          request.status === 'completed'
            ? 'bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400'
            : request.status === 'in_progress'
            ? 'bg-linear-to-r from-teal-400 via-cyan-400 to-sky-400'
            : request.status === 'cancelled'
            ? 'bg-linear-to-r from-gray-400 via-slate-400 to-zinc-400'
            : 'bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              {request.status === 'completed' && <CheckCircle className="h-6 w-6" />}
              {request.status === 'in_progress' && <PlayCircle className="h-6 w-6" />}
              {request.status === 'cancelled' && <CheckCircle className="h-6 w-6" />}
              {request.status === 'assigned' && <User className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {request.status === 'completed' && 'Service Completed'}
                {request.status === 'in_progress' && 'Service In Progress'}
                {request.status === 'cancelled' && 'Service Cancelled'}
                {request.status === 'assigned' && 'Service Assigned'}
              </h2>
              <p className="text-sm opacity-90">
                {request.status === 'completed' && 'Great job! You have successfully completed this service.'}
                {request.status === 'in_progress' && 'You are currently working on this service request.'}
                {request.status === 'cancelled' && 'This service request has been cancelled.'}
                {request.status === 'assigned' && 'Service request has been assigned to you.'}
              </p>
            </div>
          </div>
          <div className="text-sm font-mono px-4 py-2 rounded-lg bg-white/20 border-2 border-white/30">
            <span className="text-xs opacity-75">Request ID: </span>
            {request.id}
          </div>
        </div>
      </div>

      {/* Service Title Card */}
      <div className="bg-linear-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-linear-to-br from-emerald-400 to-teal-400 rounded-xl shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{request.serviceTitle || request.title}</h1>
              <Badge className={getStatusColor(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Details */}
        <Card className="border-emerald-100 lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Service Details
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600">{request.serviceDescription || request.description}</p>
              </div>

              {request.additionalNotes && (
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Additional Notes</h3>
                  <p className="text-gray-600 text-sm">{request.additionalNotes}</p>
                </div>
              )}

              {/* Before Images */}
              {request.beforeImages && request.beforeImages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    Before Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {request.beforeImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Before ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* After Images (if completed) */}
              {request.status === 'completed' && request.afterImages && request.afterImages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    After Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {request.afterImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`After ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Customer Information
                {fetchingCustomer && (
                  <span className="ml-2 text-xs text-emerald-600 animate-pulse">Loading...</span>
                )}
              </h2>

              <div className="space-y-3">
                {fetchingCustomer ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{request.customer?.name || 'N/A'}</p>
                    </div>

                    {request.customer?.phone && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone
                        </p>
                        <p className="font-medium text-gray-800">{request.customer.phone}</p>
                      </div>
                    )}

                    {request.customer?.email && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </p>
                        <p className="font-medium text-gray-800 text-sm break-all">{request.customer.email}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Schedule & Location</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-800">{formatDate(request.schedule?.date || request.scheduledDate || null)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {request.schedule?.timeSlot || request.scheduledTimeSlot || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Service Address</p>
                    <p className="font-medium text-gray-800">
                      {(request.serviceAddress?.street || request.address?.street) && `${request.serviceAddress?.street || request.address?.street}, `}
                      {request.serviceAddress?.city || request.address?.city}
                      {(request.serviceAddress?.state || request.address?.state) && `, ${request.serviceAddress?.state || request.address?.state}`}
                      {(request.serviceAddress?.pincode || request.address?.zipCode) && ` ${request.serviceAddress?.pincode || request.address?.zipCode}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                Pricing
              </h2>

              <div className="space-y-3">
                {request.status !== 'completed' && request.estimatedPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Price</span>
                    <span className="font-semibold text-gray-800">
                      ₹{typeof request.estimatedPrice === 'number' ? request.estimatedPrice.toLocaleString() : request.estimatedPrice}
                    </span>
                  </div>
                )}

                {request.status === 'completed' && (
                  <>
                    {request.finalPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Price</span>
                        <span className="font-semibold text-gray-800">
                          ₹{typeof request.finalPrice === 'number' ? request.finalPrice.toLocaleString() : request.finalPrice}
                        </span>
                      </div>
                    )}

                    {/* Check for material cost in multiple possible locations */}
                    {(request.materialCost || request.pricingDetails?.materialCost) && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Material Cost</span>
                          <span className="font-semibold text-gray-800">
                            ₹{
                              typeof (request.materialCost || request.pricingDetails?.materialCost) === 'number'
                                ? (request.materialCost || request.pricingDetails?.materialCost).toLocaleString()
                                : (request.materialCost || request.pricingDetails?.materialCost)
                            }
                          </span>
                        </div>
                        {(request.materialDescription || request.pricingDetails?.materialDescription) && (
                          <div className="bg-gray-50 rounded p-2 mt-2">
                            <p className="text-xs text-gray-500 mb-1">Materials:</p>
                            <p className="text-sm text-gray-700">
                              {request.materialDescription || request.pricingDetails?.materialDescription}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between border-t-2 border-emerald-200 pt-3 mt-2">
                      <span className="text-gray-800 font-semibold">Total Bill</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        ₹{
                          ((typeof request.finalPrice === 'number' ? request.finalPrice : parseFloat(request.finalPrice || '0')) +
                          (typeof (request.materialCost || request.pricingDetails?.materialCost) === 'number'
                            ? (request.materialCost || request.pricingDetails?.materialCost || 0)
                            : parseFloat((request.materialCost || request.pricingDetails?.materialCost || '0').toString()))).toLocaleString()
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="border-emerald-100">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {request.status === 'assigned' && (
              <Button
                onClick={handleStartService}
                disabled={actionLoading}
                className="flex-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-medium"
              >
                {actionLoading ? (
                  'Starting...'
                ) : (
                  <>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Start Service
                  </>
                )}
              </Button>
            )}

            {request.status === 'in_progress' && (
              <Button
                onClick={() => setShowCompleteDialog(true)}
                className="flex-1 bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-medium"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Service
              </Button>
            )}

            {request.status === 'completed' && (
              <div className="flex-1 text-center py-3">
                <p className="text-green-600 font-semibold">This service has been completed</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Service Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[75vh] p-0 overflow-hidden bg-white flex flex-col">
          {/* Header with Green Gradient */}
          <div className="bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 px-4 sm:px-6 py-4 sm:py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                Complete Service
              </DialogTitle>
              <DialogDescription className="text-green-100 text-sm sm:text-base">
                Add after photos, set the final price, and include any material costs.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
            {/* After Images */}
            <div>
              <Label>After Photos (Optional)</Label>
              <p className="text-sm text-gray-500 mb-2">Add URLs of photos showing the completed work</p>
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Image URL
                </Button>
              </div>

              {afterImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {afterImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`After ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImageUrl(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Price */}
            <div>
              <Label htmlFor="finalPrice">Final Service Price *</Label>
              <Input
                id="finalPrice"
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="Enter final service price"
                min="0"
                step="0.01"
              />
              {request.estimatedPrice && (
                <p className="text-sm text-gray-500 mt-1">
                  Estimated: ₹{request.estimatedPrice.toLocaleString()}
                </p>
              )}
            </div>

            {/* Material Cost */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-teal-100 rounded">
                  <IndianRupee className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-teal-900">Additional Material Cost (Optional)</Label>
                  <p className="text-xs text-teal-600">If you purchased materials for this service</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="materialCost" className="text-sm">Material Cost</Label>
                  <Input
                    id="materialCost"
                    type="number"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    placeholder="Enter material cost"
                    min="0"
                    step="0.01"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="materialDescription" className="text-sm">Material Description</Label>
                  <Textarea
                    id="materialDescription"
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="Describe the materials purchased (e.g., 2 liters of paint, 5 steel pipes...)"
                    rows={2}
                    className="bg-white text-sm"
                  />
                  <p className="text-xs text-teal-600 mt-1">
                    This will be added to the final bill and shown to the customer
                  </p>
                </div>
              </div>
            </div>

            {/* Total Price Preview */}
            {(materialCost && Number(materialCost) > 0) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-800">Service Price:</span>
                  <span className="font-semibold text-emerald-900">₹{finalPrice || '0'}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-emerald-800">Material Cost:</span>
                  <span className="font-semibold text-emerald-900">₹{materialCost}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-300">
                  <span className="font-semibold text-emerald-900">Total Bill:</span>
                  <span className="font-bold text-lg text-emerald-600">
                    ₹{((Number(finalPrice) || 0) + (Number(materialCost) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Completion Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the completed service..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 pb-6 gap-3 sm:gap-4">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteService}
              disabled={actionLoading || !finalPrice || Number(finalPrice) <= 0}
              className="bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white"
            >
              {actionLoading ? 'Completing...' : 'Complete Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
