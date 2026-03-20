export interface CommonService {
  _id?: string;
  name: string;
  description?: string;
  duration?: string;
  typicalPrice?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  unit: string;
}

export interface AdminCommission {
  type: 'fixed' | 'percentage' | 'hybrid';
  fixed?: number;
  percentage?: number;
  minCommission?: number;
  maxCommission?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  priceRange?: PriceRange;
  adminCommission?: AdminCommission;
  commonServices: (string | CommonService)[];
  requiredSkills: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  priceRange?: PriceRange;
  adminCommission?: AdminCommission;
  commonServices: (string | CommonService)[];
  requiredSkills: string[];
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  priceRange?: PriceRange;
  adminCommission?: AdminCommission;
  commonServices?: (string | CommonService)[];
  requiredSkills?: string[];
}
