export interface TrendItem {
  product: string;
  category: string;
  latest_date: string;
  latest_signal: string;
  latest_signal_cn: string;
  signal_streak_days: number;
  core_direction_streak_days: number;
  retail_direction_streak_days: number;
  latest_core_net_change: number;
  latest_core_direction_cn: string;
  latest_retail_net_change: number;
  latest_retail_direction_cn: string;
  core_cumulative_net_change: number;
  retail_cumulative_net_change: number;
  trend_status: string;
}

export interface TrendsResponse {
  dates: string[];
  total: number;
  categories: string[];
  items: TrendItem[];
}

export interface TrendDailyItem {
  date: string;
  signal: string;
  signal_cn: string;
  core_net_change: number;
  core_direction_cn: string;
  retail_net_change: number;
  retail_direction_cn: string;
  total_net_change: number;
}

export interface TrendSeriesPoint {
  date: string;
  net_change: number;
}

export interface BrokerTrendSeries {
  broker: string;
  data: TrendSeriesPoint[];
}

export interface ContractTrendSeries {
  contract: string;
  data: TrendSeriesPoint[];
}

export interface ProductTrendResponse {
  product: string;
  category: string;
  dates: string[];
  summary: {
    latest_signal: string;
    latest_signal_cn: string;
    signal_streak_days: number;
    core_direction_streak_days: number;
    retail_direction_streak_days: number;
    trend_status: string;
  };
  daily_items: TrendDailyItem[];
  broker_series: BrokerTrendSeries[];
  contract_series: ContractTrendSeries[];
}
