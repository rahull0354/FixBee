import { z } from 'zod';

export const certificationSchema = z.object({
  name: z.string().min(2, 'Certification name is required'),
  issuer: z.string().min(2, 'Issuer is required'),
  year: z.string().regex(/^\d{4}$/, 'Please enter a valid year'),
  url: z.string().url().optional().or(z.literal('')),
});

export const providerProfileSchema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio must be less than 500 characters'),
  skills: z.array(z.string()).min(1, 'Please add at least one skill'),
  certifications: z.array(certificationSchema),
  pricingType: z.enum(['per-visit', 'per-hour']),
  baseRate: z.number().min(1, 'Base rate must be greater than 0'),
  experience: z.number().min(0).max(50, 'Experience must be between 0 and 50 years'),
  serviceAreas: z.array(z.object({
    city: z.string().min(2, 'City is required'),
    areas: z.array(z.string()).optional(),
  })),
  profilePicture: z.string().url().optional().or(z.literal('')),
});

export const customerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    country: z.string().optional(),
  }),
  profilePicture: z.string().url().optional().or(z.literal('')),
});

export type ProviderProfileFormData = z.infer<typeof providerProfileSchema>;
export type CustomerProfileFormData = z.infer<typeof customerProfileSchema>;
export type CertificationFormData = z.infer<typeof certificationSchema>;
