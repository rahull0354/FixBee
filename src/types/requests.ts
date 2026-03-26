export type ServiceRequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ServiceAddress {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  providerId?: string;
  serviceProviderId?: string;
  categoryId?: string;
  serviceCategoryId?: string;
  serviceType: string;
  title?: string;
  serviceTitle?: string;
  description?: string;
  serviceDescription?: string;
  address?: ServiceAddress;
  serviceAddress?: ServiceAddress;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  schedule?: {
    date: string;
    timeSlot: string;
    preferredTime?: string;
  };
  status: ServiceRequestStatus;
  estimatedPrice?: number | string;
  finalPrice?: number | string;
  materialCost?: number;
  materialDescription?: string;
  beforeImages?: string[];
  afterImages?: string[];
  additionalNotes?: string;
  pricingDetails?: any;
  paymentStatus?: PaymentStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateServiceRequestData {
  serviceType: string;
  serviceCategoryId: string;
  serviceTitle: string;
  serviceDescription: string;
  additionalNotes?: string;
  schedule: {
    date: string;
    timeSlot: string;
  };
  serviceAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
}

export interface UpdateServiceRequestData {
  schedule?: {
    date: string;
    timeSlot: string;
  };
  address?: ServiceAddress;
  description?: string;
}
