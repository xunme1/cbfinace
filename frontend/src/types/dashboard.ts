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

export interface SignalDistributionItem {
  name: string;
  type: string;
  value: number;
}

export interface CategoryStrengthItem {
  category: string;
  strength: number;
}

export interface DashboardSummary {
  opponent_count: number;
  resonance_count: number;
  institution_attack_count: number;
  retail_noise_count: number;
  noise_count: number;
}

export interface DashboardData {
  date: string;
  noise_threshold: number;
  total_products: number;
  total_signals: number;
  summary: DashboardSummary;
  top_signals: SignalItem[];
  signal_distribution: SignalDistributionItem[];
  category_strength: CategoryStrengthItem[];
}