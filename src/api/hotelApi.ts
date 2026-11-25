import axios from 'axios';
import type {
  Hotel,
  HotelQueryFilters,
  PaginatedHotelsResponse,
} from '../types/hotel';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function resolveAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith('/uploads/') && API_BASE_URL) {
    return `${API_BASE_URL}${pathOrUrl}`;
  }
  return pathOrUrl;
}

export function extractApiError(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

export async function getHotelsApi(
  filters: HotelQueryFilters
): Promise<PaginatedHotelsResponse> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 6,
  };
  if (filters.search && filters.search.trim() !== '') {
    params.search = filters.search.trim();
  }
  if (filters.minPrice !== undefined && String(filters.minPrice).trim() !== '') {
    params.minPrice = String(filters.minPrice).trim();
  }
  if (filters.maxPrice !== undefined && String(filters.maxPrice).trim() !== '') {
    params.maxPrice = String(filters.maxPrice).trim();
  }

  const response = await apiClient.get<PaginatedHotelsResponse>('/api/hotels', {
    params,
  });
  return response.data;
}

export async function getHotelByIdApi(id: string): Promise<Hotel> {
  const response = await apiClient.get<{ data: Hotel }>(`/api/hotels/${encodeURIComponent(id)}`);
  return response.data.data;
}

export async function createHotelApi(formData: FormData): Promise<Hotel> {
  const response = await apiClient.post<{ data: Hotel }>('/api/hotels', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function updateHotelApi(id: string, formData: FormData): Promise<Hotel> {
  const response = await apiClient.put<{ data: Hotel }>(
    `/api/hotels/${encodeURIComponent(id)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
}

export async function deleteHotelApi(id: string): Promise<{ id: string; message: string }> {
  const response = await apiClient.delete<{ id: string; message: string }>(
    `/api/hotels/${encodeURIComponent(id)}`
  );
  return response.data;
}
