export interface SignalItem {
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
  
  export interface SignalsResponse {
    date: string;
    total: number;
    items: SignalItem[];
  }
  
  export interface SignalTypeOption {
    label: string;
    value: string;
  }
  
  export interface SignalTypesResponse {
    signal_types: SignalTypeOption[];
  }
  
  export interface SignalCategoriesResponse {
    date: string;
    categories: string[];
  }