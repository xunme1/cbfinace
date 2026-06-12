export type BattleSignal =
  | "opposite"
  | "same"
  | "side_a_only"
  | "side_b_only"
  | "neutral";

export interface BattleSideSummary {
  brokers: string[];
  long_position: number;
  long_change: number;
  short_position: number;
  short_change: number;
  net_change: number;
  direction: "long" | "short" | "neutral";
  direction_cn: string;
}

export interface SeatBattleItem {
  category: string;
  product: string;
  battle_signal: BattleSignal;
  battle_signal_cn: string;
  side_a: BattleSideSummary;
  side_b: BattleSideSummary;
  difference: number;
  total_abs_change: number;
}

export interface SeatBattleResponse {
  date: string;
  total: number;
  brokers: string[];
  categories: string[];
  side_a_brokers: string[];
  side_b_brokers: string[];
  items: SeatBattleItem[];
}

export interface ContractBattleRow {
  contract: string;
  battle_signal: BattleSignal;
  battle_signal_cn: string;
  side_a: BattleSideSummary;
  side_b: BattleSideSummary;
  difference: number;
  total_abs_change: number;
}

export interface BrokerContractBattleRow {
  contract: string;
  broker: string;
  side: "A" | "B";
  long_position: number;
  long_change: number;
  short_position: number;
  short_change: number;
  net_change: number;
  direction: "long" | "short" | "neutral";
  direction_cn: string;
}

export interface SeatBattleProductDetailResponse {
  date: string;
  category: string;
  product: string;
  brokers: string[];
  side_a_brokers: string[];
  side_b_brokers: string[];
  summary: SeatBattleItem;
  contract_rows: ContractBattleRow[];
  broker_contract_rows: BrokerContractBattleRow[];
}
