export interface FundFlowRankItem {
  product: string;
  flow_value: number;
  abs_flow_value: number;
  direction: "inflow" | "outflow";
  direction_cn: string;
  broker_count: number;
  brokers: string;
}

export interface FundFlowRankResponse {
  date: string;
  limit: number;
  top_inflows: FundFlowRankItem[];
  top_outflows: FundFlowRankItem[];
}
