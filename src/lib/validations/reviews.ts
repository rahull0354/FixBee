import { z } from 'zod';

export const detailedRatingsSchema = z.object({
  punctuality: z.number().min(1).max(5),
  quality: z.number().min(1).max(5),
  behaviour: z.number().min(1).max(5),
  value: z.number().min(1).max(5),
});

export const createReviewSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment must be less than 500 characters'),
  detailedRatings: detailedRatingsSchema,
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(10).max(500).optional(),
  detailedRatings: detailedRatingsSchema.optional(),
});

export const respondToReviewSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(500, 'Response must be less than 500 characters'),
});

export type CreateReviewFormData = z.infer<typeof createReviewSchema>;
export type UpdateReviewFormData = z.infer<typeof updateReviewSchema>;
export type RespondToReviewFormData = z.infer<typeof respondToReviewSchema>;
