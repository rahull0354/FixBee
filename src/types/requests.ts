export type ServiceRequestStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

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
  categoryId: string;
  serviceType: string;
  title: string;
  description: string;
  address: ServiceAddress;
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: ServiceRequestStatus;
  estimatedPrice?: number;
  finalPrice?: number;
  beforeImages?: string[];
  afterImages?: string[];
  additionalNotes?: string;
  pricingDetails?: any;
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
