'use client';

import { useEffect, useState } from 'react';
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'visible' | 'hidden'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllReviews();
      const apiData = (response as any).data || response;
      const reviewsArray = Array.isArray(apiData) ? apiData : apiData.reviews || [];
      setReviews(reviewsArray);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      setProcessing(review.id);
      await adminApi.toggleReviewVisibility(review.id);
      toast.success(`Review ${review.isVisible ? 'hidden' : 'visible'}`);
      loadReviews();
    } catch (error: any) {
      console.error('Error toggling review visibility:', error);
      toast.error('Failed to toggle review visibility');
    } finally {
      setProcessing(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchQuery === '' ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.serviceProvider?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'flagged' && review.isFlagged) ||
      (statusFilter === 'visible' && review.isVisible) ||
      (statusFilter === 'hidden' && !review.isVisible);

    return matchesSearch && matchesStatus;
  });

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
            <SelectTrigger className="w-full sm:w-48 border-blue-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Rating & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-amber-900">{review.rating}</span>
                      </div>
                      {review.isFlagged && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                      {review.isVisible ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <Eye className="h-3 w-3 mr-1" />
                          Visible
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-700 italic">&quot;{review.comment}&quot;</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>By <strong>{review.customer?.name || 'Unknown'}</strong></span>
                      <span>•</span>
                      <span>For <strong>{review.serviceProvider?.name || 'Unknown Provider'}</strong></span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>

                    {/* Service */}
                    {review.serviceRequest && (
                      <div className="text-sm text-gray-500">
                        Service: {review.serviceRequest.title}
                      </div>
                    )}

                    {/* Flag Reason */}
                    {review.isFlagged && review.flagReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs text-red-800">
                          <span className="font-semibold">Flag Reason:</span> {review.flagReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(review)}
                      disabled={processing === review.id}
                      className={review.isVisible
                        ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }
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
            </div>
          ))}
        </div>
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
