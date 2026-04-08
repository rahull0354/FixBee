'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import {
  Search,
  Star,
  Flag,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  };
  serviceProvider?: {
    id: string;
    name: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'visible' | 'hidden'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [currentPage, itemsPerPage]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add search parameter if there's a search query
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add filter parameters
      if (statusFilter === 'flagged') {
        params.flagged = true;
      } else if (statusFilter === 'visible') {
        params.visible = true;
      } else if (statusFilter === 'hidden') {
        params.visible = false;
      }

      const response = await adminApi.getAllReviews(params);
      const apiData = (response as any).data || response;
      const reviewsArray = Array.isArray(apiData) ? apiData : apiData.reviews || apiData.data || [];

      // Collect unique customer and provider IDs
      const customerIds = new Set<string>();
      const providerIds = new Set<string>();

      reviewsArray.forEach((review: any) => {
        if (review.customerId) customerIds.add(review.customerId);
        if (review.serviceProviderId) providerIds.add(review.serviceProviderId);
      });

      // Fetch customer and provider data
      const [customerResults, providerResults] = await Promise.allSettled([
        Promise.all(Array.from(customerIds).map(id => adminApi.getCustomer(id))),
        Promise.all(Array.from(providerIds).map(id => adminApi.getProvider(id)))
      ]);

      // Create maps for quick lookup
      const customerMap = new Map();
      const providerMap = new Map();

      if (customerResults.status === "fulfilled") {
        customerResults.value.forEach((result: any) => {
          const customer = (result as any).data || result;
          if (customer?.id) {
            customerMap.set(customer.id, customer);
          }
        });
      } else {
        console.error('❌ Customer fetch failed:', customerResults);
      }

      if (providerResults.status === "fulfilled") {
        providerResults.value.forEach((result: any) => {
          const provider = (result as any).data || result;
          if (provider?.id) {
            providerMap.set(provider.id, provider);
          }
        });
      } else {
        console.error('❌ Provider fetch failed:', providerResults);
      }

      // Transform API data to match frontend expectations
      const transformedReviews = reviewsArray.map((review: any) => {
        const customerData = customerMap.get(review.customerId);
        const providerData = providerMap.get(review.serviceProviderId);

        return {
          ...review,
          customer: customerData ? {
            id: customerData.id,
            name: customerData.name || 'Unknown',
            email: customerData.email,
          } : {
            id: review.customerId,
            name: 'Unknown',
          },
          serviceProvider: providerData ? {
            id: providerData.id,
            name: providerData.name || 'Provider',
            email: providerData.email,
          } : {
            id: review.serviceProviderId,
            name: 'Provider',
          },
        };
      });

      setReviews(transformedReviews);

      // Set pagination info from response
      const total = apiData.total || apiData.totalReviews || reviewsArray.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error: any) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
    loadReviews();
  }, [searchQuery, statusFilter]);

  const handleToggleVisibility = async (review: Review) => {
    try {
      setProcessing(review.id);
      // Toggle the visibility state
      const newVisibilityState = !review.isVisible;
      await adminApi.toggleReviewVisibility(review.id, newVisibilityState);
      toast.success(`Review ${newVisibilityState ? 'visible' : 'hidden'}`);

      // Update local state instead of reloading
      setReviews(prevReviews =>
        prevReviews.map(r =>
          r.id === review.id ? { ...r, isVisible: newVisibilityState } : r
        )
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to toggle review visibility');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Review Moderation
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Moderate and manage customer reviews
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:border-blue-400 focus:ring-blue-400">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-200 shadow-lg">
              <SelectItem value="all" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">All Reviews</SelectItem>
              <SelectItem value="flagged" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Flagged</SelectItem>
              <SelectItem value="visible" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Visible</SelectItem>
              <SelectItem value="hidden" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
              >
                <div className="relative">
                  {/* Background with contextual image */}
                  <div className="h-32 bg-white relative overflow-hidden border-b border-gray-100">
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80')",
                      }}
                    />
                    {/* Gradient overlay for better contrast */}
                    <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-indigo-50/50" />

                    {/* Status Badge - Top Left */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      {review.isFlagged && (
                        <Badge className="bg-red-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm shadow-md">
                          <Flag className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                      {review.isVisible ? (
                        <Badge className="bg-green-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm shadow-md">
                          <Eye className="h-3 w-3 mr-1" />
                          Visible
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm shadow-md">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>

                    {/* Rating Badge - Top Right */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-lg border border-amber-200">
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300 fill-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-base font-bold text-gray-900">{review.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Provider Names - Overlapping the background */}
                  <div className="absolute top-20 left-6 right-6 z-10 flex items-center justify-center gap-3">
                    {/* Customer */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 border-4 border-white shadow-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {review.customer?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-900 mt-1.5 max-w-20 mx-auto leading-tight">
                        {review.customer?.name || 'Unknown'}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-xl border-2 border-blue-200">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Provider */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-400 to-purple-600 border-4 border-white shadow-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {review.serviceProvider?.name?.charAt(0).toUpperCase() || 'P'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-purple-900 mt-1.5 max-w-20 mx-auto leading-tight">
                        {review.serviceProvider?.name || 'Provider'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-20 px-6 pb-5 h-full flex flex-col">
                  {/* Date */}
                  <div className="flex items-center justify-end mb-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  {/* Review Comment - Fixed max height */}
                  <div className="bg-linear-to-br from-gray-50 to-blue-50/50 rounded-xl p-4 border border-blue-100 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 italic leading-relaxed line-clamp-4">
                        &quot;{review.comment}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Flag Reason */}
                  {review.isFlagged && review.flagReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-red-900 uppercase">Reason</p>
                          <p className="text-xs text-red-800 line-clamp-2">{review.flagReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1"></div>

                  {/* Action Buttons - Always at bottom */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/reviews/${review.id}`)}
                      className="flex-1 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-medium h-10 text-sm"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleVisibility(review)}
                      disabled={processing === review.id}
                      className={`flex-1 rounded-lg font-medium h-10 text-sm transition-all duration-200 ${
                        review.isVisible
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                          : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {processing === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : review.isVisible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-blue-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing</span>
                <span className="font-semibold text-gray-900">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>
                <span>to</span>
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                <span>of</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
                <span>reviews</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border-blue-200 text-blue-700 hover:bg-blue-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}
    </div>
  );
}

function EmptyState({
  searchQuery,
  statusFilter,
}: {
  searchQuery: string;
  statusFilter: string;
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full mb-4 sm:mb-6">
        <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== 'all' ? 'No reviews found' : 'No reviews yet'}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : statusFilter !== 'all'
          ? `You don't have any ${statusFilter} reviews`
          : 'Reviews will appear here once customers leave feedback'}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="bg-white rounded-2xl p-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}