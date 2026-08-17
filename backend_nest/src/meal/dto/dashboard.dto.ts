import { z } from 'zod';

export const DashboardFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  supplierId: z.coerce.number().optional().nullable(),
  contractType: z.string().optional().nullable(),
});

export type DashboardFilterDto = z.infer<typeof DashboardFilterSchema>;

export interface DashboardSummaryDto {
  kpis: {
    totalSuppliers: { value: number; trend: string; trendValue: number };
    monthlyOrders: { value: number; trend: string; trendValue: number };
    mealsProvided: { value: number; trend: string; trendValue: number };
    totalCost: { value: number; trend: string; trendValue: number };
    overallRating: { value: number; trend: string; trendValue: number };
  };
  ranking: Array<{
    id: number;
    name: string;
    logo_url: string;
    orderCount: number;
    mealCount: number;
    rating: number;
  }>;
  trends: {
    months: string[];
    series: Array<{
      supplierName: string;
      data: number[];
    }>;
  };
  costDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  orderQuantityByMeal: Array<{
    supplierName: string;
    breakfast: number;
    lunch: number;
    dinner: number;
  }>;
  criteriaAverages: Array<{
    code: string;
    name: string;
    value: number;
  }>;
  recentActivities: Array<{
    id: number;
    supplierId?: number;
    type: string;
    title: string;
    description: string;
    timeLabel: string;
    icon: string;
  }>;
  alerts: Array<{
    id: number;
    supplierId?: number;
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel: string;
  }>;
  comparisonTable: Array<{
    id: number;
    name: string;
    orderCount: number;
    mealCount: number;
    revenue: number;
    rating: number;
    qualityRating: number;
    ontimeRating: number;
    trendValue: number;
    performance: number;
  }>;
}
