import type { BrokerChange } from "./seatTracker";

export interface ProductSummary {
  all_contract_net_change: number;
  main_contract: string;
  main_contract_net_change: number;
  second_contract: string;
  second_contract_net_change: number;
  has_conflict: boolean;
  description: string;
}

export interface ContractSummary {
  contract: string;
  long_change: number;
  short_change: number;
  net_change: number;
  direction: "long" | "short" | "neutral";
  direction_cn: string;
}

export interface ContractBrokerDetail {
  contract: string;
  broker: string;
  long_position: number;
  long_change: number;
  short_position: number;
  short_change: number;
  net_change: number;
  direction: "long" | "short" | "neutral";
  direction_cn: string;
}

export interface ProductDashboardResponse {
  date: string;
  product: string;
  category: string;
  signal: string;
  signal_cn: string;
  summary: ProductSummary;
  broker_summary: BrokerChange[];
  contract_summary: ContractSummary[];
  contract_broker_detail: ContractBrokerDetail[];
  tracked_brokers: string[];
}
