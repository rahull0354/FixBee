export interface DetailedRatings {
  punctuality: number;
  quality: number;
  behaviour: number;
  value: number;
}

export interface Review {
  id: string;
  requestId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string;
  detailedRatings?: DetailedRatings;
  providerResponse?: string;
  isFlagged: boolean;
  flagReason?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  provider?: {
    id: string;
    name: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    serviceType?: string;
  };
}

export interface CreateReviewData {
  requestId: string;
  rating: number;
  comment: string;
  detailedRatings: DetailedRatings;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  detailedRatings?: DetailedRatings;
}

export interface RespondToReviewData {
  response: string;
}
