import { apiClient } from "./client";
import type { ProductDashboardResponse } from "../types/productDashboard";

export async function fetchProductDashboard(
  product: string,
  date?: string
): Promise<ProductDashboardResponse> {
  const response = await apiClient.get<ProductDashboardResponse>(
    `/api/products/${encodeURIComponent(product)}/dashboard`,
    {
      params: { date: date || undefined },
    }
  );

  return response.data;
}
