import { apiClient } from "./client";
import type {
  SeatBattleProductDetailResponse,
  SeatBattleResponse,
} from "../types/seatBattle";

export interface SeatBattleParams {
  date: string;
  sideA: string[];
  sideB: string[];
  category?: string;
  keyword?: string;
  signal?: string;
}

function joinBrokers(brokers: string[]) {
  return brokers.join(",");
}

export async function fetchSeatBattle(
  params: SeatBattleParams
): Promise<SeatBattleResponse> {
  const response = await apiClient.get<SeatBattleResponse>("/api/seat-battle", {
    params: {
      date: params.date,
      side_a: joinBrokers(params.sideA),
      side_b: joinBrokers(params.sideB),
      category: params.category || undefined,
      keyword: params.keyword || undefined,
      signal: params.signal || undefined,
    },
  });

  return response.data;
}

export async function fetchSeatBattleProductDetail(
  product: string,
  date: string,
  sideA: string[],
  sideB: string[]
): Promise<SeatBattleProductDetailResponse> {
  const response = await apiClient.get<SeatBattleProductDetailResponse>(
    `/api/seat-battle/products/${encodeURIComponent(product)}`,
    {
      params: {
        date,
        side_a: joinBrokers(sideA),
        side_b: joinBrokers(sideB),
      },
    }
  );

  return response.data;
}
