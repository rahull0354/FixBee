export type PricingType = 'per-visit' | 'per-hour';

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  year: string;
  url?: string;
}

export interface ServiceArea {
  city: string;
  areas?: string[];
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface ProviderProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  skills: string[];
  certifications: Certification[];
  pricingType: PricingType;
  baseRate: number;
  experience: number;
  availability: Availability[];
  serviceAreas: ServiceArea[];
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  totalEarnings?: number;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderListItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  city: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isSuspended?: boolean;
}
