import { apiClient } from "./client";
import type { AvailableDataDates } from "../types/dataCalendar";

export async function fetchAvailableDataDates(): Promise<AvailableDataDates> {
  const response = await apiClient.get<AvailableDataDates>("/api/data/available-dates");

  return response.data;
}
