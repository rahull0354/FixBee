'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi } from '@/lib/api';
import { Review } from '@/types';
import {
  Star,
  ArrowLeft,
  Loader2,
  Briefcase,
  User,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// Validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5, 'Rating must be 5 or less'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
  detailedRatings: z.object({
    punctuality: z.number().min(1).max(5),
    quality: z.number().min(1).max(5),
    behaviour: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      detailedRatings: {
        punctuality: 5,
        quality: 5,
        behaviour: 5,
        value: 5,
      },
    },
  });

  const rating = watch('rating');
  const detailedRatings = watch('detailedRatings');

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      // We need to fetch the review from the list since there's no individual endpoint
      const response = await customerApi.getMyReviews();

      // Handle different response formats
      let reviews: Review[] = [];
      if (Array.isArray(response)) {
        reviews = response;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        reviews = (response as any).data;
      } else if ((response as any).reviews && Array.isArray((response as any).reviews)) {
        reviews = (response as any).reviews;
      }

      const currentReview = reviews.find((r) => r.id === reviewId);

      if (!currentReview) {
        toast.error('Review not found');
        router.push('/customer/reviews');
        return;
      }

      setReview(currentReview);

      // Populate form
      setValue('rating', currentReview.rating);
      setValue('comment', currentReview.comment);
      if (currentReview.detailedRatings) {
        setValue('detailedRatings.punctuality', currentReview.detailedRatings.punctuality || 0);
        setValue('detailedRatings.quality', currentReview.detailedRatings.quality || 0);
        setValue('detailedRatings.behaviour', currentReview.detailedRatings.behaviour || 0);
        setValue('detailedRatings.value', currentReview.detailedRatings.value || 0);
      }
    } catch (error: any) {
      console.error('Error loading review:', error);
      toast.error('Failed to load review');
      router.push('/customer/reviews');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setSubmitting(true);

      await customerApi.updateReview(reviewId, {
        rating: data.rating,
        comment: data.comment,
        detailedRatings: data.detailedRatings,
      });

      toast.success('Review updated successfully!');
      router.push('/customer/reviews');
    } catch (error: any) {
      console.error('Error updating review:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to update review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 sm:w-8 sm:h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-800">{value}.0</span>
      </div>
    );
  };

  const SmallStarRating = ({
    value,
    onChange,
    label,
    color,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
    color: string;
  }) => {
    const bgColors = {
      sky: 'bg-sky-50 border-sky-100',
      blue: 'bg-blue-50 border-blue-100',
      indigo: 'bg-indigo-50 border-indigo-100',
      violet: 'bg-violet-50 border-violet-100',
    };

    return (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border ${bgColors[color as keyof typeof bgColors]}`}>
        <span className="text-xs sm:text-sm font-semibold text-gray-700 w-full sm:w-28">{label}</span>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-all hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  star <= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Back Button Skeleton */}
        <Skeleton className="h-6 w-32" />

        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-14 w-72 mb-3" />
          <Skeleton className="h-7 w-96" />
        </div>

        {/* Service Request Info Skeleton */}
        <div className="bg-linear-to-r from-sky-500 to-blue-500 rounded-3xl p-8">
          <div className="flex items-start gap-6">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 p-10">
          {/* Overall Rating Skeleton */}
          <div className="mb-10">
            <Skeleton className="h-9 w-48 mb-6" />
            <div className="flex items-center justify-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-full" />
              ))}
            </div>
          </div>

          {/* Detailed Ratings Skeleton */}
          <div className="mb-10">
            <Skeleton className="h-9 w-56 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Comment Skeleton */}
          <div className="mb-10">
            <Skeleton className="h-9 w-40 mb-4" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>

          {/* Submit Button Skeleton */}
          <div className="flex justify-center gap-4">
            <Skeleton className="h-14 w-32 rounded-2xl" />
            <Skeleton className="h-14 w-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </button>

        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Edit Your Review
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Update your review and rating for this service
            </p>
          </div>
        </div>
      </div>

      {/* Service Info Banner */}
      {review && review.serviceRequest && (
        <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center gap-3 sm:gap-5">
            <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
              <Briefcase className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 truncate">{review.serviceRequest.title}</h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {review.serviceRequest.serviceType && (
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm font-semibold">
                    {review.serviceRequest.serviceType}
                  </span>
                )}
                {review.provider && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-sm sm:text-base truncate">{review.provider.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Right Column - Detailed Ratings & Comment (First on mobile) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          {/* Detailed Ratings */}
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <Label className="text-base sm:text-lg font-bold text-gray-900 mb-1 block">
                  Rate Specific Aspects
                </Label>
                <p className="text-xs sm:text-sm text-gray-600">Update your ratings for different aspects</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SmallStarRating
                  value={detailedRatings.punctuality}
                  onChange={(val) => setValue('detailedRatings.punctuality', val)}
                  label="Punctuality"
                  color="sky"
                />
                <SmallStarRating
                  value={detailedRatings.quality}
                  onChange={(val) => setValue('detailedRatings.quality', val)}
                  label="Quality of Work"
                  color="blue"
                />
                <SmallStarRating
                  value={detailedRatings.behaviour}
                  onChange={(val) => setValue('detailedRatings.behaviour', val)}
                  label="Professionalism"
                  color="indigo"
                />
                <SmallStarRating
                  value={detailedRatings.value}
                  onChange={(val) => setValue('detailedRatings.value', val)}
                  label="Value for Money"
                  color="violet"
                />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="comment" className="text-base sm:text-lg font-bold text-gray-900 mb-1 block">
                  Your Review
                </Label>
                <p className="text-xs sm:text-sm text-gray-600">Update your review (minimum 10 characters)</p>
              </div>

              <Textarea
                id="comment"
                rows={8}
                placeholder="Share your experience with this service provider. How was the service quality? Would you recommend them?"
                {...register('comment')}
                className={`text-sm sm:text-base resize-none rounded-xl ${errors.comment ? 'border-red-500 focus:border-red-500' : 'focus:border-sky-400'}`}
              />

              {errors.comment && (
                <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.comment.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Left Column - Overall Rating & Submit (Last on mobile) */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Overall Rating Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-4 sm:p-6 lg:p-8 lg:sticky lg:top-8">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <Label className="text-base sm:text-lg font-bold text-gray-900 mb-1 block">
                  Overall Rating
                </Label>
                <p className="text-xs sm:text-sm text-gray-600">Update your overall rating</p>
              </div>

              <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-sky-100">
                <div className="flex flex-col items-center">
                  <StarRating
                    value={rating}
                    onChange={(val) => setValue('rating', val)}
                  />
                  <div className="mt-3 sm:mt-4 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800">
                      {rating === 5 && 'Exceptional!'}
                      {rating === 4 && 'Very Good!'}
                      {rating === 3 && 'Good!'}
                      {rating === 2 && 'Fair!'}
                      {rating === 1 && 'Poor!'}
                    </p>
                  </div>
                </div>
              </div>

              {errors.rating && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.rating.message}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
                className="w-full py-2 sm:py-3 h-auto text-sm sm:text-base font-semibold rounded-xl border-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 text-white py-2 sm:py-3 h-auto text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4 fill-yellow-300" />
                    Update Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 sm:p-6">
            <h3 className="font-bold text-sky-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Lightbulb className="h-5 w-5 text-sky-600" />
              Tips
            </h3>
            <ul className="text-xs sm:text-sm text-sky-800 space-y-1 sm:space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0">•</span>
                <span>Be specific and honest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0">•</span>
                <span>Focus on the service quality</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0">•</span>
                <span>Mention professionalism</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0">•</span>
                <span>Help others with your feedback</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
