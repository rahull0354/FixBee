export type NotificationType =
  | "request_assigned"
  | "request_started"
  | "request_completed"
  | "request_cancelled"
  | "review_received"
  | "provider_response"
  | "system_update"
  | "promotional";

export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: {
    requestId?: string;
    reviewId?: string;
    providerId?: string;
    providerName?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  requestUpdates: boolean;
  reviewUpdates: boolean;
  promotional: boolean;
  systemUpdates: boolean;
}
