import axios from "axios";
import type { DashboardData } from "../types/dashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function fetchDashboard(date: string): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>("/api/dashboard", {
    params: {
      date,
    },
  });

  return response.data;
}
