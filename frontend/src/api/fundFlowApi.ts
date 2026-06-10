import { apiClient } from "./client";
import type { FundFlowRankResponse } from "../types/fundFlow";

export async function fetchFundFlowRank(
  date: string,
  limit = 5
): Promise<FundFlowRankResponse> {
  const response = await apiClient.get<FundFlowRankResponse>("/api/fund-flows/rank", {
    params: { date, limit },
  });

  return response.data;
}
