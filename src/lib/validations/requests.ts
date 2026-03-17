import { z } from 'zod';

export const serviceAddressSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  country: z.string().optional(),
});

export const createServiceRequestSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  serviceType: z.string().min(2, 'Service type is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide more details (at least 20 characters)'),
  address: serviceAddressSchema,
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTimeSlot: z.string().min(1, 'Please select a time slot'),
  beforeImages: z.array(z.string().url()).optional(),
});

export const updateServiceRequestSchema = z.object({
  scheduledDate: z.string().min(1, 'Please select a date').optional(),
  scheduledTimeSlot: z.string().min(1, 'Please select a time slot').optional(),
  address: serviceAddressSchema.optional(),
  description: z.string().min(20).optional(),
});

export type CreateServiceRequestFormData = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestFormData = z.infer<typeof updateServiceRequestSchema>;
