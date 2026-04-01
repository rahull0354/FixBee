"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { customerApi } from "@/lib/api";
import { Review } from "@/types";
import {
  Star,
  MessageSquare,
  Edit,
  Trash2,
  Calendar,
  Briefcase,
  User,
  Loader2,
  Plus,
  Search,
  X,
  Eye,
  EyeOff,
  Flag,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceRequests, setServiceRequests] = useState<Map<string, any>>(
    new Map(),
  );
  const [providers, setProviders] = useState<Map<string, any>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log("[Reviews] Starting to load reviews...");

      const response = await customerApi.getMyReviews();
      console.log("[Reviews] Raw API response:", response);

      // Handle different response formats
      let data: Review[] = [];
      if (Array.isArray(response)) {
        data = response;
        console.log("[Reviews] Response is an array, length:", response.length);
      } else if (
        (response as any).data &&
        Array.isArray((response as any).data)
      ) {
        data = (response as any).data;
        console.log("[Reviews] Response has data array, length:", data.length);
      } else if (
        (response as any).reviews &&
        Array.isArray((response as any).reviews)
      ) {
        data = (response as any).reviews;
        console.log(
          "[Reviews] Response has reviews array, length:",
          data.length,
        );
      } else {
        console.warn("[Reviews] Unexpected response format:", response);
      }

      console.log("[Reviews] Total reviews received from API:", data.length);
      console.log(
        "[Reviews] All review IDs:",
        data.map((r) => r.id),
      );

      // Log each review with details
      data.forEach((review, index) => {
        console.log(`[Reviews] Review ${index + 1}:`, {
          id: review.id,
          serviceRequestId: review.serviceRequestId,
          serviceProviderId: review.serviceProviderId,
          rating: review.rating,
          comment: review.comment?.substring(0, 50) + "...",
          isVisible: review.isVisible,
          isFlagged: review.isFlagged,
        });
      });

      // Filter out any null/undefined reviews and ensure valid data
      const validReviews = data.filter((review) => review && review.id);

      console.log(
        "[Reviews] Valid reviews after filtering:",
        validReviews.length,
      );
      console.log(
        "[Reviews] Valid review IDs:",
        validReviews.map((r) => r.id),
      );

      setReviews(validReviews);

      // Collect unique IDs to fetch
      const uniqueRequestIds = [
        ...new Set(data.map((r) => r.serviceRequestId).filter(Boolean)),
      ];
      const uniqueProviderIds = [
        ...new Set(data.map((r) => r.serviceProviderId).filter(Boolean)),
      ];

      console.log("[Reviews] Unique request IDs to fetch:", uniqueRequestIds);
      console.log("[Reviews] Unique provider IDs to fetch:", uniqueProviderIds);

      // Fetch all details in parallel
      console.log("[Reviews] Starting parallel fetch of details...");
      const [requestResults, providerResults] = await Promise.allSettled([
        Promise.all(
          uniqueRequestIds.map(async (id) => {
            try {
              console.log("[Reviews] Fetching service request:", id);
              const response = await customerApi.getServiceRequest(id);
              const reqData = (response as any).data || response;
              console.log(
                "[Reviews] Successfully fetched request:",
                id,
                reqData,
              );
              return { id, data: reqData };
            } catch (err) {
              console.error("[Reviews] Failed to fetch request:", id, err);
              return { id, data: null };
            }
          }),
        ),
        Promise.all(
          uniqueProviderIds.map(async (id) => {
            try {
              console.log("[Reviews] Fetching provider:", id);
              const response = await customerApi.getProvider(id);
              const provData = (response as any).data || response;
              console.log(
                "[Reviews] Successfully fetched provider:",
                id,
                provData,
              );
              return { id, data: provData };
            } catch (err) {
              console.error("[Reviews] Failed to fetch provider:", id, err);
              return { id, data: null };
            }
          }),
        ),
      ]);

      // Build maps from results
      const requestMap = new Map();
      const providerMap = new Map();

      if (requestResults.status === "fulfilled") {
        requestResults.value.forEach((result: any) => {
          if (result?.data) {
            requestMap.set(result.id, result.data);
          }
        });
        console.log(
          "[Reviews] Request map built with",
          requestMap.size,
          "entries",
        );
      } else {
        console.error(
          "[Reviews] Request promises rejected:",
          requestResults.reason,
        );
      }

      if (providerResults.status === "fulfilled") {
        providerResults.value.forEach((result: any) => {
          if (result?.data) {
            providerMap.set(result.id, result.data);
          }
        });
        console.log(
          "[Reviews] Provider map built with",
          providerMap.size,
          "entries",
        );
      } else {
        console.error(
          "[Reviews] Provider promises rejected:",
          providerResults.reason,
        );
      }

      console.log(
        "[Reviews] Final state - Reviews:",
        data.length,
        "Requests:",
        requestMap.size,
        "Providers:",
        providerMap.size,
      );

      setServiceRequests(requestMap);
      setProviders(providerMap);

      console.log("[Reviews] Loading complete!");
    } catch (error: any) {
      console.error("[Reviews] Error loading reviews:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load reviews";
      toast.error(message);
      setReviews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleting(true);

      await customerApi.deleteReview(reviewToDelete);
      toast.success("Review deleted successfully");
      setDeleteDialogOpen(false);
      setReviewToDelete(null);

      // Reload the list to ensure we have the latest data from server
      loadReviews();
    } catch (error: any) {
      console.error("[Reviews] Error deleting review:", error);
      console.error("[Reviews] Error response:", error?.response);
      console.error("[Reviews] Error data:", error?.response?.data);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete review";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((review) => {
        const comment = review.comment?.toLowerCase() || "";
        const serviceRequest = serviceRequests.get(
          review.serviceRequestId || "",
        );
        const serviceName =
          serviceRequest?.title?.toLowerCase() ||
          serviceRequest?.serviceTitle?.toLowerCase() ||
          "";
        const provider = providers.get(review.serviceProviderId || "");
        const providerName = provider?.name?.toLowerCase() || "";

        return (
          comment.includes(query) ||
          serviceName.includes(query) ||
          providerName.includes(query)
        );
      });
    }

    // Apply rating filter
    if (ratingFilter !== null) {
      filtered = filtered.filter((review) => review.rating === ratingFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, searchQuery, ratingFilter, sortBy, serviceRequests, providers]);

  const clearFilters = () => {
    setSearchQuery("");
    setRatingFilter(null);
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery || ratingFilter !== null || sortBy !== "newest";

  const renderStars = (rating: number, size = "w-5 h-5") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-11 w-36" />
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Rating Breakdown Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="flex-1 h-3" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              My Reviews
            </h1>
            <p className="text-gray-600">
              {filteredReviews.length > 0
                ? `Showing ${filteredReviews.length} of ${reviews.length} review${reviews.length > 1 ? "s" : ""}`
                : "You haven't written any reviews yet"}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-linear-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 lg:p-6 border border-sky-100 shadow-lg">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />
              </div>
              <Input
                type="text"
                placeholder="Search by service, provider, or review text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-9 sm:pr-10 h-10 sm:h-12 text-sm border-sky-200 bg-white focus:border-sky-400 focus:ring-sky-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            {/* Rating Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-semibold text-sky-700">
                Rating:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setRatingFilter(ratingFilter === rating ? null : rating)
                    }
                    className={`group relative px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      ratingFilter === rating
                        ? "bg-linear-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-200 scale-105"
                        : "bg-white text-gray-600 border border-sky-200 hover:border-sky-300 hover:shadow-md hover:scale-105"
                    }`}
                  >
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <Star
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${ratingFilter === rating ? "fill-yellow-300" : "fill-gray-300 group-hover:fill-sky-400"}`}
                      />
                      {rating}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setRatingFilter(null)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    ratingFilter === null
                      ? "bg-linear-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-200 scale-105"
                      : "bg-white text-gray-600 border border-sky-200 hover:border-sky-300 hover:shadow-md hover:scale-105"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Sort and Clear */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-semibold text-sky-700">
                  Sort:
                </span>
                <Select
                  value={sortBy}
                  onValueChange={(value) =>
                    setSortBy(
                      value as "newest" | "oldest" | "highest" | "lowest",
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-40 lg:w-52 border-sky-200 bg-white shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-sky-200 shadow-lg">
                    <SelectItem
                      value="newest"
                      className="hover:bg-sky-50 focus:bg-sky-100 cursor-pointer text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Newest First
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="oldest"
                      className="hover:bg-sky-50 focus:bg-sky-100 cursor-pointer text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Oldest First
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="highest"
                      className="hover:bg-sky-50 focus:bg-sky-100 cursor-pointer text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Highest Rated
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="lowest"
                      className="hover:bg-sky-50 focus:bg-sky-100 cursor-pointer text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Lowest Rated
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto px-3 sm:px-5 py-2 sm:py-2.5 h-auto bg-white border-2 border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 font-semibold shadow-sm hover:shadow-md transition-all text-xs sm:text-sm"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {reviews.length}
                </p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 rounded-xl">
                <Star className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {
                    reviews.filter((r) => {
                      const reviewDate = new Date(r.createdAt);
                      const now = new Date();
                      const thirtyDaysAgo = new Date(
                        now.setDate(now.getDate() - 30),
                      );
                      return reviewDate >= thirtyDaysAgo;
                    }).length
                  }
                </p>
                <p className="text-sm text-gray-600">Reviews in Last 30 Days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {reviews.length > 0 ? "No Matching Reviews" : "No Reviews Yet"}
          </h2>
          <p className="text-gray-600 mb-6">
            {reviews.length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Once you complete services, you can leave reviews for your providers."}
          </p>
          {reviews.length > 0 ? (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              Clear Filters
            </Button>
          ) : (
            <Link href="/customer/requests">
              <Button className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white">
                View My Requests
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Review Content */}
                <div className="flex-1 space-y-4">
                  {/* Header: Service & Provider Info */}
                  <div className="space-y-3">
                    {/* Service Title */}
                    {serviceRequests.has(review.serviceRequestId || "") ? (
                      <Link
                        href={`/customer/requests/${review.serviceRequestId}`}
                        className="block group"
                      >
                        <div className="flex items-start gap-3 p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100 hover:border-sky-300 transition-colors">
                          <div className="p-2 bg-sky-200 rounded-lg group-hover:bg-sky-300 transition-colors">
                            <Briefcase className="h-5 w-5 text-sky-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-800 group-hover:text-sky-700 transition-colors">
                              {serviceRequests.get(
                                review.serviceRequestId || "",
                              )?.title || "Service Request"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Click to view service details
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100">
                        <div className="p-2 bg-sky-200 rounded-lg">
                          <Briefcase className="h-5 w-5 text-sky-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-800">
                            Service Request #
                            {review.serviceRequestId?.slice(0, 8)}...
                          </h3>
                          <p className="text-sm text-gray-600">
                            Loading service details...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Provider Info */}
                    {providers.has(review.serviceProviderId || "") ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {providers
                            .get(review.serviceProviderId || "")
                            ?.name?.charAt(0)
                            .toUpperCase() || "P"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-emerald-600 font-medium">
                            Service Provider
                          </p>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {providers.get(review.serviceProviderId || "")
                              ?.name || "Provider"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-linear-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">
                            Service Provider
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            Loading provider details...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!review.isVisible && (
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border-2 border-amber-300">
                        <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800">
                          Hidden by Admin
                        </span>
                      </div>
                    )}
                    {review.isFlagged && (
                      <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border-2 border-red-300">
                        <Flag className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs font-semibold text-red-800">
                          Flagged by Admin
                          {review.flagReason && `: ${review.flagReason}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rating & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-lg font-semibold text-gray-800">
                        {review.rating}.0
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/customer/reviews/${review.id}/edit`)
                        }
                        disabled={review.isFlagged}
                        className={review.isFlagged ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(review.id)}
                        disabled={review.isFlagged}
                        className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                          review.isFlagged ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  {/* Detailed Ratings */}
                  {review.detailedRatings && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-sky-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">
                          Punctuality
                        </p>
                        <div className="flex items-center gap-1">
                          {renderStars(
                            review.detailedRatings.punctuality || 3,
                            "w-4 h-4",
                          )}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Quality</p>
                        <div className="flex items-center gap-1">
                          {renderStars(
                            review.detailedRatings.quality || 3,
                            "w-4 h-4",
                          )}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Behaviour</p>
                        <div className="flex items-center gap-1">
                          {renderStars(
                            review.detailedRatings.behaviour || 3,
                            "w-4 h-4",
                          )}
                        </div>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Value</p>
                        <div className="flex items-center gap-1">
                          {renderStars(
                            review.detailedRatings.value || 3,
                            "w-4 h-4",
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provider Response */}
                  {review.providerResponse && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <p className="text-sm font-semibold text-emerald-800">
                          Provider Response
                        </p>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {typeof review.providerResponse === "string"
                          ? review.providerResponse
                          : (review.providerResponse as any).comment ||
                            "Provider has responded"}
                      </p>
                    </div>
                  )}

                  {/* Footer: Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Reviewed on {formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full bg-white border-2 border-sky-100 mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3 pr-6">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-xl shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <span className="wrap-break-word">Delete Review</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 pt-1 sm:pt-2 leading-relaxed">
              Are you sure you want to delete this review? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row pt-4 sm:pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReviewToDelete(null);
              }}
              className="w-full sm:flex-1 border-2 border-sky-200 text-sky-700 hover:bg-sky-50 text-sm sm:text-base py-2.5 sm:py-3 h-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:flex-1 bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-2.5 sm:py-3 h-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
