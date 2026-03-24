"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Star,
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  MessageSquare,
  Reply,
  Loader2,
  ThumbsUp,
  AlertCircle,
  Clock,
  MapPin,
  Award,
  CheckCircle,
} from "lucide-react";
import { providerApi } from "@/lib/api";
import { Review } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getReviewById(reviewId);
      console.log("📝 Review detail response:", response);

      // Backend returns: { success: true, data: { review } }
      let data = response;

      // Handle nested response structures
      if ((response as any).review) {
        // Response is { review: {...} }
        data = (response as any).review;
        console.log("✅ Found review in response.review:", data);
      } else if ((response as any).data?.review) {
        // Response is { data: { review: {...} } }
        data = (response as any).data.review;
        console.log("✅ Found review in data.review:", data);
      } else if ((response as any).data) {
        // Response is { data: {...} }
        data = (response as any).data;
        console.log("✅ Using data directly:", data);
      } else if (Array.isArray(response) && response.length > 0) {
        data = response[0];
        console.log("✅ Response is array, using first item:", data);
      }

      console.log("📊 Final review data:", data);
      console.log("📊 Has customer?", !!data?.customer);
      console.log("📊 Has serviceRequest?", !!data?.serviceRequest);

      setReview(data);
    } catch (error: any) {
      console.error("Error loading review:", error);
      toast.error(error?.response?.data?.message || "Failed to load review");
      router.push("/provider/reviews");
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!review || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      setSubmittingResponse(true);
      await providerApi.respondToReview(review.id, { response: responseText });
      toast.success("Response submitted successfully!");
      setRespondDialogOpen(false);
      loadReview(); // Reload to show the response
    } catch (error: any) {
      console.error("Error submitting response:", error);
      toast.error(
        error?.response?.data?.message || "Failed to submit response",
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const StarRating = ({
    rating,
    size = "md",
  }: {
    rating: number | undefined;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };
    const safeRating = rating ?? 0;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= safeRating
                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                : "fill-gray-200 text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Main Review Card Skeleton */}
        <Card className="border-2 border-emerald-100 shadow-2xl">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Customer Info & Rating Skeleton */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-20 w-28 rounded-2xl" />
              </div>

              {/* Service Information Skeleton */}
              <Card className="bg-gray-50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-64 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Ratings Skeleton */}
              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Skeleton */}
              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-24 w-full" />
              </div>

              {/* Response Section Skeleton */}
              <div className="bg-emerald-50 rounded-xl p-5">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Review Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The review you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/provider/reviews")}>
              Back to Reviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug: Log the review state
  console.log("🎨 Rendering review:", review);
  console.log("👤 Customer:", review?.customer);
  console.log("🔧 Service Request:", review?.serviceRequest);
  console.log("⭐ Rating:", review?.rating);
  console.log("💬 Comment:", review?.comment);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
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
      <Card className="border-emerald-100 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Customer & Rating Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow">
                    {review.customer?.name?.charAt(0) || "C"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow border border-emerald-200">
                    <div className="bg-linear-to-br from-yellow-400 to-amber-500 rounded-full p-1">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-bold text-gray-900">
                    {review.customer?.name || "Customer"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm font-semibold px-3 py-1">
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-xl font-bold">{review.rating}</span>
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-600" />
                </div>
              </Badge>
            </div>

            {/* Service Request Info */}
            {review.serviceRequest && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                  Service Request
                </div>
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  {review.serviceRequest.title}
                </div>
                {review.serviceRequest.serviceType && (
                  <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {review.serviceRequest.serviceType}
                  </div>
                )}
              </div>
            )}

            {/* Chat-style Conversation */}
            <div className="space-y-4 sm:space-y-6">
              {/* Conversation Header */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Conversation
              </div>

              {/* Customer's Message (Left-aligned like received message) */}
              <div className="flex gap-2 sm:gap-3">
                {/* Customer Avatar */}
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md">
                    {review.customer?.name?.charAt(0) || "C"}
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {review.customer?.name || "Customer"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      <Star className="h-3 w-3 fill-yellow-600" />
                      {review.rating}/5
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider's Response (Right-aligned like sent message) */}
              {review.providerResponse ? (
                <div className="flex gap-2 sm:gap-3 justify-end">
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
                      <span className="text-xs sm:text-sm font-semibold text-emerald-700">
                        You
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className="bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-3 shadow-md">
                      <p className="text-white text-sm sm:text-base leading-relaxed">
                        {typeof review.providerResponse === "object" ? review.providerResponse.comment : review.providerResponse}
                      </p>
                    </div>

                    {/* Response Badge */}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Response sent</span>
                    </div>
                  </div>

                  {/* Provider Avatar */}
                  <div className="shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md">
                      {review.provider?.name?.charAt(0) || "P"}
                    </div>
                  </div>
                </div>
              ) : (
                /* No Response Placeholder */
                <div className="flex gap-2 sm:gap-3 justify-end">
                  <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl rounded-tr-sm px-3 sm:px-4 py-3 sm:py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-semibold">No response yet</span>
                      </div>
                      <p className="text-amber-800 text-xs sm:text-sm">
                        Send a response to show customers you value their feedback
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md opacity-50">
                      {review.provider?.name?.charAt(0) || "P"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-emerald-100">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/provider/reviews")}
              className="w-full sm:w-auto"
            >
              Back to Reviews
            </Button>
            <Button
              onClick={() => {
                setResponseText(typeof review.providerResponse === "object" ? review.providerResponse?.comment || "" : review.providerResponse || "");
                setRespondDialogOpen(true);
              }}
              className="w-full sm:w-auto gap-2 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white"
            >
              <Reply className="h-4 w-4" />
              {review.providerResponse ? "Edit Response" : "Write Response"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-150 max-h-[85vh] sm:max-h-[80vh] p-0 overflow-hidden flex flex-col bg-white">
          <div className="bg-linear-to-r from-emerald-500 to-teal-500 p-4 sm:p-6 text-white shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  <Reply className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                Respond to Review
              </DialogTitle>
              <DialogDescription className="text-emerald-100 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Write a thoughtful response to {review.customer?.name}'s review.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            {review && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-600">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800 italic text-sm">
                  "{review.comment}"
                </p>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <Label
                htmlFor="response"
                className="text-sm sm:text-base font-semibold text-gray-800"
              >
                Your Response <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="response"
                rows={4}
                placeholder="Thank the customer for their feedback and address any specific points they mentioned..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="text-sm resize-none"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-gray-500">
                  {responseText.length} characters
                </span>
                <span
                  className={`text-xs font-medium ${
                    responseText.length >= 20
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {responseText.length >= 20
                    ? "✓ Good length"
                    : "Minimum 20 characters"}
                </span>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div className="text-xs text-teal-900">
                  <strong className="text-xs">
                    Tips for a great response:
                  </strong>
                  <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
                    <li>Thank the customer for their review</li>
                    <li>Address specific points they mentioned</li>
                    <li>Keep it professional and courteous</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 pt-0 bg-white gap-2 sm:gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
              disabled={submittingResponse}
              className="flex-1 sm:flex-none text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={submitResponse}
              disabled={submittingResponse || responseText.length < 20}
              className="flex-1 sm:flex-none bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm"
            >
              {submittingResponse ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Reply className="mr-2 h-4 w-4" />
                  Submit Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
