'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { customerApi } from '@/lib/api';
import { Review } from '@/types';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceRequests, setServiceRequests] = useState<Map<string, any>>(new Map());
  const [providers, setProviders] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getMyReviews();

      console.log('[Reviews] API Response:', response);

      // Handle different response formats
      let data: Review[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        data = (response as any).data;
      } else if ((response as any).reviews && Array.isArray((response as any).reviews)) {
        data = (response as any).reviews;
      }

      console.log('[Reviews] Parsed data:', data);
      console.log('[Reviews] First review structure:', data[0]);
      setReviews(data);

      // Fetch service request and provider details for each review
      const requestMap = new Map();
      const providerMap = new Map();

      for (const review of data) {
        // Fetch service request details
        if (review.requestId && !requestMap.has(review.requestId)) {
          try {
            const reqResponse = await customerApi.getServiceRequest(review.requestId);
            const reqData = (reqResponse as any).data || reqResponse;
            requestMap.set(review.requestId, reqData);
          } catch (err) {
            console.warn('[Reviews] Failed to fetch request:', review.requestId);
          }
        }

        // Fetch provider details
        if (review.providerId && !providerMap.has(review.providerId)) {
          try {
            const provResponse = await customerApi.getProvider(review.providerId);
            const provData = (provResponse as any).data || provResponse;
            providerMap.set(review.providerId, provData);
          } catch (err) {
            console.warn('[Reviews] Failed to fetch provider:', review.providerId);
          }
        }
      }

      setServiceRequests(requestMap);
      setProviders(providerMap);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to load reviews';
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
      toast.success('Review deleted successfully');
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      loadReviews(); // Reload the list
    } catch (error: any) {
      console.error('Error deleting review:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to delete review';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reviews</h1>
          <p className="text-gray-600">
            {reviews.length > 0
              ? `You have ${reviews.length} review${reviews.length > 1 ? 's' : ''}`
              : 'You haven\'t written any reviews yet'}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-100 rounded-xl">
                <Star className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 rounded-xl">
                <Briefcase className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {reviews.filter((r) => r.rating >= 4).length}
                </p>
                <p className="text-sm text-gray-600">Positive Reviews</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Reviews Yet</h2>
          <p className="text-gray-600 mb-6">
            Once you complete services, you can leave reviews for your providers.
          </p>
          <Link href="/customer/requests">
            <Button className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white">
              View My Requests
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
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
                    {serviceRequests.has(review.requestId || '') ? (
                      <Link
                        href={`/customer/requests/${review.requestId}`}
                        className="block group"
                      >
                        <div className="flex items-start gap-3 p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100 hover:border-sky-300 transition-colors">
                          <div className="p-2 bg-sky-200 rounded-lg group-hover:bg-sky-300 transition-colors">
                            <Briefcase className="h-5 w-5 text-sky-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-800 group-hover:text-sky-700 transition-colors">
                              {serviceRequests.get(review.requestId || '')?.title || 'Service Request'}
                            </h3>
                            <p className="text-sm text-gray-600">Click to view service details</p>
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
                            Service Request #{review.requestId?.slice(0, 8)}...
                          </h3>
                          <p className="text-sm text-gray-600">Loading service details...</p>
                        </div>
                      </div>
                    )}

                    {/* Provider Info */}
                    {providers.has(review.providerId || '') ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {providers.get(review.providerId || '')?.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-emerald-600 font-medium">Service Provider</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {providers.get(review.providerId || '')?.name || 'Provider'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-linear-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">Service Provider</p>
                          <p className="text-sm font-semibold text-gray-800">
                            Loading provider details...
                          </p>
                        </div>
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
                        onClick={() => (window.location.href = `/customer/reviews/${review.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(review.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  )}

                  {/* Detailed Ratings */}
                  {review.detailedRatings && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-sky-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Punctuality</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.detailedRatings.punctuality || 3, 'w-4 h-4')}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Quality</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.detailedRatings.quality || 3, 'w-4 h-4')}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Behaviour</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.detailedRatings.behaviour || 3, 'w-4 h-4')}
                        </div>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Value</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.detailedRatings.value || 3, 'w-4 h-4')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provider Response */}
                  {review.providerResponse && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <p className="text-sm font-semibold text-emerald-800">Provider Response</p>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {typeof review.providerResponse === 'string'
                          ? review.providerResponse
                          : (review.providerResponse as any).comment || 'Provider has responded'}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReviewToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
