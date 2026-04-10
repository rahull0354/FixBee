"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  Star,
  Flag,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Briefcase,
  User,
  Building,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  providerResponse?: string | {
    comment: string;
    respondedAt: string;
  };
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  serviceProvider?: {
    id: string;
    name: string;
    email?: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
  };
}

// Interface for API response (may have additional fields)
interface ApiReviewResponse extends Review {
  visible?: boolean;
  flagged?: boolean;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  providerId?: string;
  providerName?: string;
  providerEmail?: string;
  serviceProviderId?: string;
  serviceProviderName?: string;
  serviceProviderEmail?: string;
  serviceRequestId?: string;
  serviceTitle?: string;
  customer_user?: {
    name?: string;
    fullName?: string;
    email?: string;
  };
  provider_user?: {
    name?: string;
    fullName?: string;
    email?: string;
  };
  provider?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export default function AdminReviewDetailsPage() {
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagAndHide, setFlagAndHide] = useState(false);

  useEffect(() => {
    loadReview();
  }, []);

  const loadReview = async () => {
    try {
      setLoading(true);
      const id = window.location.pathname.split('/').pop();
      if (!id) {
        toast.error("Review ID not found");
        router.push("/admin/reviews");
        return;
      }

      const apiResponse = await adminApi.getReview(id);

      // Handle new admin route response structure: { review, customer, serviceProvider, serviceRequest }
      // Note: API client interceptor extracts 'data' field, so apiResponse is the data object
      const reviewData = (apiResponse as any).review;
      const customerData = (apiResponse as any).customer;
      const serviceProviderData = (apiResponse as any).serviceProvider;
      const serviceRequestData = (apiResponse as any).serviceRequest;

      // Fallback to old structure if new structure not available
      let response: ApiReviewResponse;
      if (reviewData) {
        response = reviewData;
      } else if ((apiResponse as any).data) {
        response = (apiResponse as any).data;
      } else if ((apiResponse as any).review) {
        response = (apiResponse as any).review;
      } else {
        response = apiResponse as ApiReviewResponse;
      }

      // Transform the data to match frontend expectations
      const transformedReview: Review = {
        id: response.id,
        rating: response.rating,
        comment: response.comment,
        isVisible: response.isVisible ?? response.visible ?? true,
        isFlagged: response.isFlagged ?? response.flagged ?? false,
        flagReason: response.flagReason,
        createdAt: response.createdAt,
        providerResponse: response.providerResponse,
        customer: customerData ? {
          id: customerData.id,
          name: customerData.name || 'Unknown',
          email: customerData.email,
        } : response.customer ? {
          id: response.customer.id,
          name: response.customer.name || 'Unknown',
          email: response.customer.email,
        } : {
          id: response.customerId || '',
          name: response.customerName || response.customer_user?.name || response.customer_user?.fullName || 'Unknown',
          email: response.customerEmail || response.customer_user?.email,
        },
        serviceProvider: serviceProviderData ? {
          id: serviceProviderData.id,
          name: serviceProviderData.name || 'Provider',
          email: serviceProviderData.email,
        } : response.serviceProvider || response.provider ? {
          id: (response.serviceProvider || response.provider)?.id || response.providerId || response.serviceProviderId || '',
          name: (response.serviceProvider?.name || response.provider?.name) || response.providerName || response.serviceProviderName || response.provider_user?.name || response.provider_user?.fullName || 'Provider',
          email: (response.serviceProvider?.email || response.provider?.email) || response.providerEmail || response.serviceProviderEmail || response.provider_user?.email,
        } : {
          id: response.providerId || response.serviceProviderId || '',
          name: response.providerName || response.serviceProviderName || response.provider_user?.name || response.provider_user?.fullName || 'Provider',
          email: response.providerEmail || response.serviceProviderEmail || response.provider_user?.email,
        },
        serviceRequest: serviceRequestData ? {
          id: serviceRequestData.id,
          title: serviceRequestData.title || serviceRequestData.serviceTitle || 'Service',
        } : response.serviceRequest ? {
          id: response.serviceRequest.id,
          title: response.serviceRequest.title,
        } : {
          id: response.serviceRequestId || '',
          title: response.serviceTitle || 'Service',
        },
      };

      setReview(transformedReview);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to load review details");
      router.push("/admin/reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!review) return;

    try {
      setProcessing(true);
      // Toggle the visibility state
      const newVisibilityState = !review.isVisible;
      await adminApi.toggleReviewVisibility(review.id, newVisibilityState);
      toast.success(`Review ${newVisibilityState ? "visible" : "hidden"}`);

      // Update local state instead of reloading to avoid potential 400 errors
      setReview({
        ...review,
        isVisible: newVisibilityState,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to toggle review visibility");
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async () => {
    if (!review || !flagReason.trim()) {
      toast.error("Please provide a reason for flagging");
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        reason: flagReason,
        hide: flagAndHide,
      };

      // Step 1: Flag the review
      await adminApi.flagReview(review.id, payload);

      // Step 2: If hide checkbox is checked, explicitly update visibility
      if (flagAndHide && review.isVisible) {
        await adminApi.toggleReviewVisibility(review.id, false);
      }

      // Update local state
      const updatedReview = {
        ...review,
        isFlagged: true,
        flagReason: flagReason,
        isVisible: flagAndHide ? false : review.isVisible, // Only update visibility if hide checkbox is checked
      };

      setReview(updatedReview);

      toast.success(`Review flagged${flagAndHide ? ' and hidden' : ''} successfully`);
      setFlagDialogOpen(false);
      setFlagReason("");
      setFlagAndHide(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to flag review");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnflag = async () => {
    if (!review) return;

    try {
      setProcessing(true);
      await adminApi.unflagReview(review.id);
      toast.success("Review unflagged successfully");
      loadReview();
    } catch (error: any) {
      toast.error("Failed to unflag review");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="bg-white rounded-2xl p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Review not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/reviews")}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Review Details
          </h1>
        </div>
      </div>

      {/* Review Card */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-3 sm:p-4 md:p-6">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Customer & Rating Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 md:gap-4 pb-3 sm:pb-4 md:pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-linear-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shadow-md">
                  {review.customer?.name?.charAt(0) || "C"}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 sm:p-1 shadow border border-violet-200">
                  <div className="bg-linear-to-br from-yellow-400 to-amber-500 rounded-full p-0.5 sm:p-1">
                    <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 fill-white" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">
                  {review.customer?.name || "Customer"}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-0.5">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">
              <Badge className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 ${
                review.isVisible
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}>
                {review.isVisible ? (
                  <>
                    <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="text-xs sm:text-sm">Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="text-xs sm:text-sm">Hidden</span>
                  </>
                )}
              </Badge>
              {review.isFlagged && (
                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1">
                  <Flag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="text-xs sm:text-sm">Flagged</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center justify-center">
            <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-amber-200 shadow-md">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{review.rating}</div>
              </div>
            </div>
          </div>

          {/* Service Request Info */}
          {review.serviceRequest && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-violet-600" />
                <span className="text-xs sm:text-sm">Service Request</span>
              </div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 leading-tight">
                {review.serviceRequest.title}
              </div>
              {review.serviceProvider && (
                <div className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                  by {review.serviceProvider.name}
                </div>
              )}
            </div>
          )}

          {/* Chat-style Conversation */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Conversation Header */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600" />
              <span className="text-xs sm:text-sm">Review Comment</span>
            </div>

            {/* Customer's Review (Left-aligned) */}
            <div className="flex gap-1.5 sm:gap-2 md:gap-3">
              {/* Customer Avatar */}
              <div className="shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm md:text-base shadow-md">
                  {review.customer?.name?.charAt(0) || "C"}
                </div>
              </div>

              {/* Message Bubble */}
              <div className="flex-1 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {review.customer?.name || "Customer"}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="mb-1.5 sm:mb-2">
                  <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold">
                    <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-600" />
                    <span className="text-xs">{review.rating}/5</span>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 shadow-sm">
                  <p className="text-gray-800 text-xs sm:text-sm md:text-base leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>

            {/* Provider's Response (Right-aligned) */}
            {review.providerResponse ? (
              <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-end">
                {/* Message Bubble */}
                <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-baseline gap-2 mb-1 justify-end">
                    <span className="text-xs text-gray-500">
                      {typeof review.providerResponse === "object" && review.providerResponse.respondedAt
                        ? new Date(review.providerResponse.respondedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Responded"}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-purple-700">
                      {review.serviceProvider?.name || "Provider"}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-linear-to-br from-purple-500 to-indigo-500 rounded-2xl rounded-tr-sm px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 shadow-md">
                    <p className="text-white text-xs sm:text-sm md:text-base leading-relaxed">
                      {typeof review.providerResponse === "object" ? review.providerResponse.comment : review.providerResponse}
                    </p>
                  </div>
                </div>

                {/* Provider Avatar */}
                <div className="shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm md:text-base shadow-md">
                    {review.serviceProvider?.name?.charAt(0) || "P"}
                  </div>
                </div>
              </div>
            ) : (
              /* No Response Placeholder */
              <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-end">
                <div className="flex-1 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl rounded-tr-sm px-2.5 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-gray-500 mb-1.5 sm:mb-2">
                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-semibold">No response yet</span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-tight">
                      Provider hasn't responded to this review
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm md:text-base shadow-md opacity-50">
                    {review.serviceProvider?.name?.charAt(0) || "P"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flag Reason */}
          {review.isFlagged && review.flagReason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-red-900 uppercase tracking-wide mb-1">
                    Flag Reason
                  </p>
                  <p className="text-xs sm:text-sm text-red-800">{review.flagReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Provider & Customer Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Customer Info */}
            <div className="bg-violet-50 rounded-xl p-3 sm:p-4 border border-violet-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600" />
                <p className="text-[10px] sm:text-xs font-bold text-violet-900 uppercase">Customer</p>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">
                {review.customer?.name || "Unknown"}
              </p>
              {review.customer?.email && (
                <p className="text-xs text-gray-600 truncate mb-2">{review.customer.email}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 text-xs h-8 sm:h-9"
                onClick={() => router.push(`/admin/customers/${review.customer?.id}`)}
              >
                View Profile
              </Button>
            </div>

            {/* Provider Info */}
            <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border border-purple-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                <p className="text-[10px] sm:text-xs font-bold text-purple-900 uppercase">Provider</p>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">
                {review.serviceProvider?.name || "Unknown"}
              </p>
              {review.serviceProvider?.email && (
                <p className="text-xs text-gray-600 truncate mb-2">{review.serviceProvider.email}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 text-xs h-8 sm:h-9"
                onClick={() => router.push(`/admin/providers/${review.serviceProvider?.id}`)}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-100 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/reviews")}
            className="w-full sm:w-auto border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
          >
            Back to Reviews
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleVisibility}
            disabled={processing}
            className={`w-full sm:w-auto border-2 font-semibold text-xs sm:text-sm h-8 sm:h-9 md:h-10 ${
              review.isVisible
                ? "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                : "border-violet-300 text-violet-700 hover:border-violet-400 hover:bg-violet-50"
            }`}
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
            ) : review.isVisible ? (
              <>
                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">Hide Review</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">Show Review</span>
              </>
            )}
          </Button>

          {review.isFlagged ? (
            <Button
              variant="outline"
              onClick={handleUnflag}
              disabled={processing}
              className="w-full sm:w-auto border-2 border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50 font-semibold text-xs sm:text-sm h-8 sm:h-9 md:h-10"
            >
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">Unflag Review</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setFlagDialogOpen(true)}
              disabled={processing}
              className="w-full sm:w-auto border-2 border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 font-semibold text-xs sm:text-sm h-8 sm:h-9 md:h-10"
            >
              <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">Flag Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Flag Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for flagging this review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="flagReason">Reason *</Label>
              <Textarea
                id="flagReason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g., Inappropriate content, fake review, violates guidelines, etc."
                rows={3}
                className="border-violet-200 focus:border-violet-400 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="flagAndHide"
                checked={flagAndHide}
                onChange={(e) => setFlagAndHide(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="flagAndHide" className="cursor-pointer">
                Also hide this review from public view
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFlagDialogOpen(false);
                setFlagReason("");
                setFlagAndHide(false);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={processing || !flagReason.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Flagging...
                </>
              ) : (
                "Flag Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
