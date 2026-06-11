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

export interface FundFlowDetailItem {
  broker: string;
  flow_text: string;
  flow_direction: string;
  flow_direction_cn: string;
  flow_value: number;
  abs_flow_value: number;
  action: string;
}

export interface FundFlowProductDetailResponse {
  date: string;
  product: string;
  total_flow_value: number;
  direction: "inflow" | "outflow";
  direction_cn: string;
  items: FundFlowDetailItem[];
}
