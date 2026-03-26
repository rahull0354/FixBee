'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Filter,
  Search,
  Reply,
  Calendar,
  User,
  Briefcase,
  ChevronDown,
  Loader2,
  Eye,
  Award,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react';
import { providerApi } from '@/lib/api';
import { Review } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProviderReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getMyReviews();
      console.log('📊 Raw reviews response:', response);

      // Backend returns: { success: true, data: { provider, reviews, pagination } }
      let data: Review[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if ((response as any).data?.reviews && Array.isArray((response as any).data.reviews)) {
        data = (response as any).data.reviews;
        console.log('✅ Found reviews in data.reviews:', data.length);
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        data = (response as any).data;
      } else if ((response as any).reviews && Array.isArray((response as any).reviews)) {
        data = (response as any).reviews;
      }

      console.log('📝 Final reviews data:', data);
      setReviews(data);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Calculate rating statistics
  const ratingStats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    return { average, distribution, total };
  }, [reviews]);

  // Calculate detailed ratings average
  const detailedRatingsAvg = useMemo(() => {
    const reviewsWithDetailed = reviews.filter((r) => r.detailedRatings);
    if (reviewsWithDetailed.length === 0) return null;

    const sum = reviewsWithDetailed.reduce(
      (acc, r) => ({
        punctuality: acc.punctuality + (r.detailedRatings?.punctuality || 0),
        quality: acc.quality + (r.detailedRatings?.quality || 0),
        behaviour: acc.behaviour + (r.detailedRatings?.behaviour || 0),
        value: acc.value + (r.detailedRatings?.value || 0),
      }),
      { punctuality: 0, quality: 0, behaviour: 0, value: 0 }
    );

    const count = reviewsWithDetailed.length;
    return {
      punctuality: (sum.punctuality / count).toFixed(1),
      quality: (sum.quality / count).toFixed(1),
      behaviour: (sum.behaviour / count).toFixed(1),
      value: (sum.value / count).toFixed(1),
    };
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesRating = ratingFilter === 'all' || r.rating === ratingFilter;
      const matchesSearch =
        !searchQuery ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.serviceRequest?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRating && matchesSearch;
    });
  }, [reviews, ratingFilter, searchQuery]);

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    // providerResponse might be an object { comment, respondedAt } or a string
    const responseText = typeof review.providerResponse === 'object'
      ? review.providerResponse?.comment || ''
      : review.providerResponse || '';
    setResponseText(responseText);
    setRespondDialogOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedReview || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setSubmittingResponse(true);
      await providerApi.respondToReview(selectedReview.id, { comment: responseText });
      toast.success('Response submitted successfully!');
      setRespondDialogOpen(false);
      loadReviews();
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const StarRating = ({ rating, size = 'md' }: { rating: number | undefined; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };
    const safeRating = rating ?? 0;

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= safeRating
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const RatingBar = ({ count, total, rating }: { count: number; total: number; rating: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 w-20">
          <span className="text-sm font-semibold text-gray-700">{rating}</span>
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        </div>
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-linear-to-r from-yellow-400 via-yellow-500 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 w-12 text-right">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl sm:rounded-2xl bg-white/20" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-7 w-40 sm:h-8 sm:w-56 lg:h-10 lg:w-64 bg-white/20" />
                <Skeleton className="h-4 w-32 sm:h-5 sm:w-48 lg:w-64 bg-white/20 mt-1 sm:mt-2" />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6">
              <Skeleton className="h-20 w-20 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-xl sm:rounded-2xl bg-white/20 shrink-0" />
              <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 sm:h-16 lg:h-20 rounded-lg sm:rounded-xl bg-white/20" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg sm:rounded-xl mb-2 sm:mb-3 lg:mb-4" />
                <Skeleton className="h-6 w-12 sm:h-7 sm:w-14 lg:h-8 lg:w-16 mb-1" />
                <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                <Skeleton className="h-4 w-20 sm:h-5 sm:w-24 lg:h-6 lg:w-32 mt-2 sm:mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter Skeleton */}
        <Card className="border-emerald-100 shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 sm:h-12 flex-1" />
              <Skeleton className="h-10 w-full sm:h-12 sm:w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Reviews List Skeleton */}
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-emerald-100 shadow-lg">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-32 sm:h-6 sm:w-40 mb-1 sm:mb-2" />
                        <Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
                      </div>
                      <Skeleton className="h-8 w-16 sm:h-9 sm:w-20 shrink-0" />
                    </div>
                    <Skeleton className="h-12 w-full sm:h-14 lg:h-16" />
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                      <Skeleton className="h-8 w-20 sm:h-10 sm:w-24" />
                      <Skeleton className="h-8 w-24 sm:h-10 sm:w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 fill-yellow-300 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Customer Reviews</h1>
              <p className="text-emerald-100 text-sm sm:text-base lg:text-lg">Your reputation matters - see what customers say</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-5 lg:px-6 py-3 sm:py-4 shrink-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">{ratingStats.average.toFixed(1)}</div>
              <div className="flex items-center gap-1 mt-1">
                <StarRating rating={Math.round(ratingStats.average)} size="sm" />
              </div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-2">Based on {ratingStats.total} reviews</div>
            </div>

            <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{ratingStats.distribution[5]}</div>
                <div className="text-[10px] sm:text-xs text-emerald-100">5 Star</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{ratingStats.distribution[4]}</div>
                <div className="text-[10px] sm:text-xs text-emerald-100">4 Star</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{ratingStats.distribution[3]}</div>
                <div className="text-[10px] sm:text-xs text-emerald-100">3 Star</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{ratingStats.distribution[2] + ratingStats.distribution[1]}</div>
                <div className="text-[10px] sm:text-xs text-emerald-100">Low</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {detailedRatingsAvg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Punctuality', value: detailedRatingsAvg.punctuality, icon: Calendar, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
            { label: 'Quality', value: detailedRatingsAvg.quality, icon: Award, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
            { label: 'Behaviour', value: detailedRatingsAvg.behaviour, icon: User, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
            { label: 'Value', value: detailedRatingsAvg.value, icon: TrendingUp, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
          ].map((metric, idx) => (
            <Card key={idx} className={`border-0 shadow-lg overflow-hidden ${metric.bg}`}>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-linear-to-br ${metric.color} text-white mb-2 sm:mb-3 lg:mb-4`}>
                  <metric.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">{metric.value}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">{metric.label}</div>
                <div className="mt-2 sm:mt-3">
                  <StarRating rating={Math.round(Number(metric.value))} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Filter Bar */}
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews by customer name, service, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <Select
              value={ratingFilter === 'all' ? 'all' : String(ratingFilter)}
              onValueChange={(value) => setRatingFilter(value === 'all' ? 'all' : Number(value))}
            >
              <SelectTrigger className="w-full sm:w-48 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg border-0 data-placeholder:text-white h-13">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-emerald-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  All Ratings
                </SelectItem>
                <SelectItem value="5" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  5 Stars Only
                </SelectItem>
                <SelectItem value="4" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  4 Stars Only
                </SelectItem>
                <SelectItem value="3" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  3 Stars Only
                </SelectItem>
                <SelectItem value="2" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  2 Stars Only
                </SelectItem>
                <SelectItem value="1" className="hover:bg-emerald-50 focus:bg-emerald-100">
                  1 Star Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
            <div className="inline-flex p-4 sm:p-6 bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
              <MessageSquare className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">
              {reviews.length === 0 ? "No Reviews Yet" : "No Matching Reviews"}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-md mx-auto mb-4 sm:mb-6">
              {reviews.length === 0
                ? "Complete more services to get reviews from your customers. Your first review will appear here!"
                : "Try adjusting your search or filter to see more reviews."}
            </p>
            {reviews.length === 0 && (
              <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">Great service brings great reviews!</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredReviews.map((review, idx) => (
            <Card
              key={review.id}
              className="border border-emerald-100 sm:border-2 sm:border-emerald-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group relative"
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg">
                          {review.customer?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 sm:p-1 shadow-md">
                          <div className="bg-linear-to-br from-yellow-400 to-amber-500 rounded-full p-1 sm:p-1.5">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-base sm:text-lg lg:text-xl text-gray-900 truncate">
                          {review.customer?.name || 'Customer'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-600 mt-1">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {review.serviceRequest?.serviceType && (
                            <>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <span className="text-xs sm:text-sm font-medium text-emerald-600 truncate">
                                {review.serviceRequest.serviceType}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge className="bg-linear-to-r from-yellow-400 to-amber-500 text-white border-0 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-sm sm:text-base font-semibold shadow-lg">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-sm sm:text-base lg:text-lg">{review.rating}</span>
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 fill-white" />
                        </div>
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/provider/reviews/${review.id}`)}
                        className="gap-1.5 sm:gap-2 hover:bg-emerald-50 hover:border-emerald-300 px-2 sm:px-3 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </div>
                  </div>

                  {/* Service Info */}
                  {review.serviceRequest && (
                    <div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-2 sm:border-l-4 border-emerald-500">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg shrink-0">
                          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{review.serviceRequest.title}</div>
                          {review.serviceRequest.serviceType && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-0.5">{review.serviceRequest.serviceType}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Ratings */}
                  {review.detailedRatings && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                      {[
                        { label: 'Punctuality', value: review.detailedRatings.punctuality, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Quality', value: review.detailedRatings.quality, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Behaviour', value: review.detailedRatings.behaviour, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Value', value: review.detailedRatings.value, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      ].map((detail) => (
                        <div key={detail.label} className={`${detail.bg} rounded-lg sm:rounded-xl p-2 sm:p-3 text-center`}>
                          <div className="text-[10px] sm:text-xs text-gray-600 mb-1 font-medium">{detail.label}</div>
                          <StarRating rating={detail.value || 0} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  <div className="relative">
                    <div className="absolute -left-2 sm:-left-3 top-0 w-0.5 sm:w-1 h-full bg-linear-to-b from-emerald-200 to-teal-200 rounded-full"></div>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg pl-4 sm:pl-6 italic">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Provider Response */}
                  {review.providerResponse && (
                    typeof review.providerResponse === 'object'
                      ? review.providerResponse.comment
                      : review.providerResponse
                  ) && (
                    <div className="bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 sm:border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 mb-2 sm:mb-3">
                          <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                          Your Response
                        </div>
                        <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                          {typeof review.providerResponse === 'object'
                            ? review.providerResponse.comment
                            : review.providerResponse
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="text-xs sm:text-sm text-gray-500">
                      {review.providerResponse && (
                        typeof review.providerResponse === 'object'
                          ? review.providerResponse.comment
                          : review.providerResponse
                      ) ? (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          You've responded to this review
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          No response yet - respond to show you care!
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRespond(review)}
                      className="gap-1.5 sm:gap-2 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
                    >
                      <Reply className="h-4 w-4" />
                      {review.providerResponse && (
                        typeof review.providerResponse === 'object'
                          ? review.providerResponse.comment
                          : review.providerResponse
                      ) ? 'Edit Response' : 'Write Response'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-150 lg:max-w-12.5 p-0 overflow-hidden rounded-2xl">
          <div className="bg-linear-to-r from-emerald-500 to-teal-500 p-4 sm:p-5 lg:p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  <Reply className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                Respond to Review
              </DialogTitle>
              <DialogDescription className="text-emerald-100 mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base">
                Write a thoughtful response to {selectedReview?.customer?.name}'s review. This helps build trust with future customers.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
            {selectedReview && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border-l-2 sm:border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <StarRating rating={selectedReview.rating} size="sm" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {new Date(selectedReview.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800 italic text-sm sm:text-base">"{selectedReview.comment}"</p>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="response" className="text-sm sm:text-base font-semibold text-gray-800">
                Your Response <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="response"
                rows={4}
                placeholder="Thank the customer for their feedback, address any specific points they mentioned, or provide additional context about your service..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="text-sm sm:text-base resize-none"
              />
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500">{responseText.length} characters</span>
                <span className="text-emerald-600 font-medium">
                  {responseText.length >= 20 ? '✓ Good length' : 'Minimum 20 characters'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 lg:p-6 pt-0 bg-gray-50 flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
              disabled={submittingResponse}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={submitResponse}
              disabled={submittingResponse || responseText.length < 20}
              className="w-full sm:w-auto bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg text-sm sm:text-base"
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
