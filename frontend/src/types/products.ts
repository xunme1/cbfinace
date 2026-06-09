export interface ProductMatrixSummary {
    category: string;
    product: string;
    institution_net_change: number;
    retail_net_change: number;
    institution_direction: string;
    retail_direction: string;
    institution_long_change: number;
    institution_short_change: number;
    retail_long_change: number;
    retail_short_change: number;
    signal: string;
    signal_type: string;
    strength: number;
  }
  
  export interface BrokerContributionItem {
    broker: string;
    camp: string;
    long_change: number;
    short_change: number;
    net_change: number;
    long_position: number;
    short_position: number;
    contract_count: number;
    abs_net_change: number;
  }
  
  export interface ContractSummaryItem {
    contract: string;
    long_change: number;
    short_change: number;
    net_change: number;
    long_position: number;
    short_position: number;
    broker_count: number;
    abs_net_change: number;
  }
  
  export interface ContractDetailItem {
    date: string;
    category: string;
    product: string;
    contract: string;
    broker: string;
    camp: string;
    long_position: number;
    long_change: number;
    short_position: number;
    short_change: number;
    net_change: number;
    abs_net_change: number;
  }
  
  export interface ProductDetailResponse {
    date: string;
    category: string;
    product: string;
    matrix_summary: ProductMatrixSummary;
    broker_contribution: BrokerContributionItem[];
    contract_summary: ContractSummaryItem[];
    contract_details: ContractDetailItem[];
  }
  
  export interface ProductListItem {
    category: string;
    product: string;
    contract_count: number;
    broker_count: number;
  }
  
  export interface ProductListResponse {
    date: string;
    total: number;
    items: ProductListItem[];
  }