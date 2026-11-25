export interface Hotel {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HotelQueryFilters {
  search?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  page?: number;
  limit?: number;
}

export interface PaginatedHotelsResponse {
  data: Hotel[];
  pagination: PaginationState;
}
