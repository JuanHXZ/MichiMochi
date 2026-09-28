export interface ProductFlavor {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ProductNutritionalInfo {
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  sugar?: string;
}

export interface Product {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  image?: string;
  images?: string[];
  featured?: boolean;
  inStock?: boolean;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  flavors?: ProductFlavor[];
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: ProductNutritionalInfo;
  tags?: string[];
  preparationTime?: string;
  bestServedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilterQuery {
  category?: string;
  search?: string;
  featured?: boolean;
  inStock?: boolean;
}
