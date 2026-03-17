export type ServiceRequestStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface ServiceAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
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
  categoryId: string;
  serviceType: string;
  title: string;
  description: string;
  address: ServiceAddress;
  scheduledDate: string;
  scheduledTimeSlot: string;
  beforeImages?: string[];
}

export interface UpdateServiceRequestData {
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  address?: ServiceAddress;
  description?: string;
}
