export interface BrokerChange {
  broker: string;
  long_change: number;
  short_change: number;
  net_change: number;
  direction: "long" | "short" | "neutral";
  direction_cn: string;
}

export interface SeatTrackerItem {
  product: string;
  category: string;
  signal: string;
  signal_cn: string;
  main_contract: string;
  main_contract_net_change: number;
  second_contract: string;
  second_contract_net_change: number;
  all_contract_net_change: number;
  broker_changes: BrokerChange[];
}

export interface SeatTrackerResponse {
  date: string;
  total: number;
  categories: string[];
  items: SeatTrackerItem[];
}

export interface SeatTrackerCategoriesResponse {
  date: string;
  categories: string[];
}
