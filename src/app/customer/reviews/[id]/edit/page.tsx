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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        setValue('detailedRatings.punctuality', currentReview.detailedRatings.punctuality);
        setValue('detailedRatings.quality', currentReview.detailedRatings.quality);
        setValue('detailedRatings.behaviour', currentReview.detailedRatings.behaviour);
        setValue('detailedRatings.value', currentReview.detailedRatings.value);
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
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-base font-semibold text-gray-800">{value}.0</span>
        <span className="text-xs text-gray-500">/ 5.0</span>
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
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${bgColors[color as keyof typeof bgColors]}`}>
        <span className="text-sm font-semibold text-gray-700 w-28">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-all hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-6 h-6 ${
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="h-16 w-16 animate-spin text-sky-500 mx-auto relative" />
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading review details...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Your Review</h1>
        <p className="text-gray-600">Update your review and rating for this service</p>
      </div>

      {/* Service Info Card */}
      {review && review.serviceRequest && (
        <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Briefcase className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{review.serviceRequest.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-sky-100">
                {review.serviceRequest.serviceType && (
                  <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {review.serviceRequest.serviceType}
                  </span>
                )}
                {review.provider && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{review.provider.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Overall Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-800">
              Overall Rating *
            </Label>
            <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <StarRating
                value={rating}
                onChange={(val) => setValue('rating', val)}
              />
              {errors.rating && (
                <p className="text-sm text-red-500 mt-2">{errors.rating.message}</p>
              )}
            </div>
          </div>

          {/* Detailed Ratings & Comment Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detailed Ratings */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                Detailed Ratings
              </Label>
              <div className="space-y-3">
                <SmallStarRating
                  value={detailedRatings.punctuality}
                  onChange={(val) => setValue('detailedRatings.punctuality', val)}
                  label="Punctuality"
                  color="sky"
                />
                <SmallStarRating
                  value={detailedRatings.quality}
                  onChange={(val) => setValue('detailedRatings.quality', val)}
                  label="Quality"
                  color="blue"
                />
                <SmallStarRating
                  value={detailedRatings.behaviour}
                  onChange={(val) => setValue('detailedRatings.behaviour', val)}
                  label="Behaviour"
                  color="indigo"
                />
                <SmallStarRating
                  value={detailedRatings.value}
                  onChange={(val) => setValue('detailedRatings.value', val)}
                  label="Value"
                  color="violet"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-lg font-semibold text-gray-800">
                Your Review * <span className="text-sm font-normal text-gray-500 ml-2">(min 10 characters)</span>
              </Label>
              <Textarea
                id="comment"
                rows={13}
                placeholder="Share your experience with this service provider. How was the service quality? Would you recommend them?"
                {...register('comment')}
                className={`text-base ${errors.comment ? 'border-red-500 focus:border-red-500' : 'focus:border-sky-400'}`}
              />
              {errors.comment && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.comment.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-6 py-2 h-auto text-base font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white px-6 py-2 h-auto text-base font-medium shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Review...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-5 w-5 fill-yellow-300" />
                  Update Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
