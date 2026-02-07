import { MonthlyReport } from './index';

export interface ReportFilters {
  year: number;
  month?: number;
  business_id: number;
}

export interface TaxSummary {
  total_tax_collected: number;
  total_tax_deductible: number;
  net_tax_liability: number;
  by_month: Array<{
    month: string;
    tax_collected: number;
    tax_deductible: number;
  }>;
}

export interface ProfitLossStatement {
  revenue: {
    total: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  net_profit: number;
  profit_margin: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}