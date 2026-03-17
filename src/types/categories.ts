export interface CommonService {
  name: string;
  description?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  priceRange?: PriceRange;
  commonServices: string[];
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
  commonServices: string[];
  requiredSkills: string[];
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  priceRange?: PriceRange;
  commonServices?: string[];
  requiredSkills?: string[];
}
