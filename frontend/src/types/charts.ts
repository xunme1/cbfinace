export interface SignalDistributionItem {
    name: string;
    type: string;
    value: number;
  }
  
  export interface SignalDistributionResponse {
    date: string;
    chart_type: string;
    title: string;
    data: SignalDistributionItem[];
  }
  
  export interface CategoryStrengthItem {
    category: string;
    strength: number;
  }
  
  export interface CategoryStrengthResponse {
    date: string;
    chart_type: string;
    title: string;
    data: CategoryStrengthItem[];
  }
  
  export interface TopProductItem {
    product: string;
    category: string;
    signal_type: string;
    signal: string;
    strength: number;
    institution_net_change: number;
    retail_net_change: number;
  }
  
  export interface TopProductsResponse {
    date: string;
    chart_type: string;
    title: string;
    data: TopProductItem[];
  }
  
  export interface MatrixScatterItem {
    product: string;
    category: string;
    x: number;
    y: number;
    strength: number;
    signal_type: string;
    signal: string;
    institution_direction: string;
    retail_direction: string;
  }
  
  export interface MatrixScatterResponse {
    date: string;
    chart_type: string;
    title: string;
    x_axis: string;
    y_axis: string;
    quadrants: Record<string, string>;
    data: MatrixScatterItem[];
  }