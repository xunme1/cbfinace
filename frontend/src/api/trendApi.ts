import { apiClient } from "./client";
import type { ProductTrendResponse, TrendsResponse } from "../types/trends";

export interface FetchTrendsParams {
  endDate?: string;
  days: number;
  category?: string;
  keyword?: string;
  signal?: string;
}

export async function fetchTrends(params: FetchTrendsParams): Promise<TrendsResponse> {
  const response = await apiClient.get<TrendsResponse>("/api/trends", {
    params: {
      end_date: params.endDate || undefined,
      days: params.days,
      category: params.category || undefined,
      keyword: params.keyword || undefined,
      signal: params.signal || undefined,
    },
  });

  return response.data;
}

export async function fetchProductTrend(
  product: string,
  endDate: string | undefined,
  days: number
): Promise<ProductTrendResponse> {
  const response = await apiClient.get<ProductTrendResponse>(
    `/api/trends/products/${encodeURIComponent(product)}`,
    {
      params: {
        end_date: endDate || undefined,
        days,
      },
    }
  );

  return response.data;
}
