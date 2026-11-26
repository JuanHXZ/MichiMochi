export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryFilterQuery {
  visible?: boolean;
  search?: string;
}
