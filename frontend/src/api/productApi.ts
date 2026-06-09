import { apiClient } from "./client";
import type {
  ProductDetailResponse,
  ProductListResponse,
} from "../types/products";

export async function fetchProductDetail(
  date: string,
  product: string
): Promise<ProductDetailResponse> {
  const response = await apiClient.get<ProductDetailResponse>(
    `/api/products/${encodeURIComponent(product)}`,
    {
      params: { date },
    }
  );

  return response.data;
}

export async function fetchProducts(
  date: string,
  keyword?: string
): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/api/products", {
    params: {
      date,
      keyword: keyword || undefined,
    },
  });

  return response.data;
}