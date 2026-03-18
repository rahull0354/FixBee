'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';
import {
  Star,
  ArrowLeft,
  Loader2,
  Briefcase,
  Calendar,
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

export default function CreateReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);

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
    if (!requestId) {
      toast.error('No request specified');
      router.push('/customer/requests');
      return;
    }
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getServiceRequest(requestId as any);
      const data: ServiceRequest = (response as any).data || response;

      if (data.status !== 'completed') {
        toast.error('You can only review completed services');
        router.push(`/customer/requests/${requestId}`);
        return;
      }

      setServiceRequest(data);
    } catch (error: any) {
      console.error('Error loading request:', error);
      toast.error('Failed to load service request');
      router.push('/customer/requests');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!requestId) return;

    try {
      setSubmitting(true);

      await customerApi.createReview(requestId, {
        rating: data.rating,
        comment: data.comment,
        detailedRatings: data.detailedRatings,
      });

      toast.success('Review submitted successfully!');
      router.push('/customer/reviews');
    } catch (error: any) {
      console.error('Error creating review:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-2xl font-bold text-gray-800">{value}.0</span>
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
      sky: 'bg-sky-50',
      blue: 'bg-blue-50',
      indigo: 'bg-indigo-50',
      violet: 'bg-violet-50',
    };

    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl ${bgColors[color as keyof typeof bgColors]}`}>
        <span className="text-sm font-semibold text-gray-700 w-28">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110"
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
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!serviceRequest) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Request
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Write a Review</h1>
        <p className="text-gray-600">Share your experience to help others choose great service providers</p>
      </div>

      {/* Service Info Card */}
      <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">{serviceRequest.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-sky-100">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {serviceRequest.serviceType}
              </span>
              {serviceRequest.finalPrice && (
                <span className="font-semibold">
                  ${serviceRequest.finalPrice}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Overall Rating */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-800">
              Overall Rating *
            </Label>
            <div className="bg-gray-50 rounded-xl p-6">
              <StarRating
                value={rating}
                onChange={(val) => setValue('rating', val)}
              />
              <p className="text-sm text-gray-600 mt-2">
                {rating === 5 && 'Excellent! Exceeded all expectations'}
                {rating === 4 && 'Very good! Mostly satisfied'}
                {rating === 3 && 'Good! Average experience'}
                {rating === 2 && 'Fair! Below expectations'}
                {rating === 1 && 'Poor! Did not meet expectations'}
              </p>
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating.message}</p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-800">
              Rate Specific Aspects
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Behaviour"
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

          {/* Comment */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-lg font-semibold text-gray-800">
              Your Review *
            </Label>
            <Textarea
              id="comment"
              rows={6}
              placeholder="Tell us about your experience. Was the service provider professional? Did they complete the work on time? Would you recommend them to others?"
              {...register('comment')}
              className={`text-base ${errors.comment ? 'border-red-500' : ''}`}
            />
            <div className="flex justify-between items-center">
              {errors.comment && (
                <p className="text-sm text-red-500">{errors.comment.message}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                Minimum 10 characters
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="bg-linea-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for a great review</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about what was good or could be improved</li>
          <li>• Mention if the provider was on time and professional</li>
          <li>• Describe the quality of work completed</li>
          <li>• Help others make informed decisions</li>
        </ul>
      </div>
    </div>
  );
}
