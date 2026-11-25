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

export interface HotelQueryParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}

export interface PaginatedHotelsResult {
  data: Hotel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
