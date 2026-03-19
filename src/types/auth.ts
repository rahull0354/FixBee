export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profilePicture?: string;
  isVerified?: boolean;
  isActive?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deactivatedAt?: string | Date;
  reactivationToken?: string;
  reactivationExpires?: string | Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCustomerData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  profilePicture?: string;
}

export interface RegisterProviderData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}
