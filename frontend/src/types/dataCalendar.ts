export interface AvailableDataDates {
  positions_dates: string[];
  fund_flow_dates: string[];
  common_dates: string[];
  latest_positions_date: string | null;
  latest_fund_flow_date: string | null;
  latest_common_date: string | null;
}
