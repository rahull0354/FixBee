export interface DetailedRatings {
  punctuality: number;
  quality: number;
  behaviour: number;
  value?: number;
  valueForMoney?: number;
}

export interface Review {
  id: string;
  serviceRequestId: string;
  customerId: string;
  serviceProviderId: string;
  rating: number;
  comment: string;
  detailedRatings?: DetailedRatings;
  providerResponse?: string | {
    comment: string;
    respondedAt: string;
  };
  isFlagged: boolean;
  flagReason?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
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
    description?: string;
  };
}

export interface CreateReviewData {
  serviceRequestId?: string; // Optional since it's passed in URL
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
  comment: string;
}
