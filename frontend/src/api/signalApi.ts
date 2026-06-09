import { apiClient } from "./client";
import type {
  SignalsResponse,
  SignalTypesResponse,
  SignalCategoriesResponse,
} from "../types/signals";

export interface FetchSignalsParams {
  date: string;
  signalType?: string;
  category?: string;
  keyword?: string;
  limit?: number;
}

export async function fetchSignals(
  params: FetchSignalsParams
): Promise<SignalsResponse> {
  const response = await apiClient.get<SignalsResponse>("/api/signals", {
    params: {
      date: params.date,
      signal_type: params.signalType || undefined,
      category: params.category || undefined,
      keyword: params.keyword || undefined,
      limit: params.limit || undefined,
    },
  });

  return response.data;
}

export async function fetchSignalTypes(): Promise<SignalTypesResponse> {
  const response = await apiClient.get<SignalTypesResponse>("/api/signal-types");
  return response.data;
}

export async function fetchSignalCategories(
  date: string
): Promise<SignalCategoriesResponse> {
  const response = await apiClient.get<SignalCategoriesResponse>(
    "/api/signal-categories",
    {
      params: { date },
    }
  );

  return response.data;
}