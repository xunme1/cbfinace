import { apiClient } from "./client";
import type {
  FundFlowProductDetailResponse,
  FundFlowRankResponse,
} from "../types/fundFlow";

export async function fetchFundFlowRank(
  date: string,
  limit = 5
): Promise<FundFlowRankResponse> {
  const response = await apiClient.get<FundFlowRankResponse>("/api/fund-flows/rank", {
    params: { date, limit },
  });

  return response.data;
}

export async function fetchProductFundFlowDetail(
  product: string,
  date: string
): Promise<FundFlowProductDetailResponse> {
  const response = await apiClient.get<FundFlowProductDetailResponse>(
    `/api/fund-flows/products/${encodeURIComponent(product)}`,
    {
      params: { date },
    }
  );

  return response.data;
}
