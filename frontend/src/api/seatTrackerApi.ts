import { apiClient } from "./client";
import type {
  SeatTrackerCategoriesResponse,
  SeatTrackerResponse,
} from "../types/seatTracker";

export interface FetchSeatTrackerParams {
  date?: string;
  signal?: string;
  category?: string;
  keyword?: string;
}

export async function fetchSeatTracker(
  params: FetchSeatTrackerParams
): Promise<SeatTrackerResponse> {
  const response = await apiClient.get<SeatTrackerResponse>("/api/seat-tracker", {
    params: {
      date: params.date || undefined,
      signal: params.signal || undefined,
      category: params.category || undefined,
      keyword: params.keyword || undefined,
    },
  });

  return response.data;
}

export async function fetchSeatTrackerCategories(
  date?: string
): Promise<SeatTrackerCategoriesResponse> {
  const response = await apiClient.get<SeatTrackerCategoriesResponse>(
    "/api/seat-tracker/categories",
    {
      params: { date: date || undefined },
    }
  );

  return response.data;
}
