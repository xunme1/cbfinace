import { apiClient } from "./client";
import type {
  SignalDistributionResponse,
  CategoryStrengthResponse,
  TopProductsResponse,
  MatrixScatterResponse,
} from "../types/charts";

export async function fetchSignalDistribution(
  date: string
): Promise<SignalDistributionResponse> {
  const response = await apiClient.get<SignalDistributionResponse>(
    "/api/charts/signal-distribution",
    {
      params: { date },
    }
  );

  return response.data;
}

export async function fetchCategoryStrength(
  date: string
): Promise<CategoryStrengthResponse> {
  const response = await apiClient.get<CategoryStrengthResponse>(
    "/api/charts/category-strength",
    {
      params: { date },
    }
  );

  return response.data;
}

export async function fetchTopProducts(
  date: string,
  limit = 10
): Promise<TopProductsResponse> {
  const response = await apiClient.get<TopProductsResponse>(
    "/api/charts/top-products",
    {
      params: { date, limit },
    }
  );

  return response.data;
}

export async function fetchMatrixScatter(
  date: string
): Promise<MatrixScatterResponse> {
  const response = await apiClient.get<MatrixScatterResponse>(
    "/api/charts/matrix-scatter",
    {
      params: { date },
    }
  );

  return response.data;
}