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
  isSuspended?: boolean;
  suspensionReason?: string;
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
  accessToken: string | null;
  refreshToken: string | null;
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
    pincode: string;
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
  message: string;
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId?: string;  // Session ID for tracking and revocation
  customer?: User;
  serviceProvider?: User;
  provider?: User;
  author?: User;
  admin?: User;
}

export interface RefreshTokenResponse {
  message: string;
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Session {
  id: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    userAgent: string;
  };
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  revoked?: boolean;  // Whether the session has been revoked
}

export interface SessionsResponse {
  message: string;
  success: boolean;
  sessions: Session[];
}

export interface LogoutResponse {
  message: string;
  success: boolean;
}

export interface LogoutAllResponse {
  message: string;
  success: boolean;
  count: number;
}

export interface RevokeSessionResponse {
  message: string;
  success: boolean;
}
