import { z } from 'zod';

export const SupplierContractSchema = z.object({
  supplier_id: z.number().or(z.string().transform(Number)),
  contract_no: z.string(),
  contract_type: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  value_amount: z.number(),
  status: z.enum(['active', 'expired', 'terminated', 'draft']).default('draft'),
  file_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const SupplierOrderSchema = z.object({
  supplier_id: z.number().or(z.string().transform(Number)),
  menu_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  order_date: z.string(),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner']),
  expected_qty: z.number(),
  unit_price: z.number(),
  status: z.enum(['draft', 'confirmed', 'delivered', 'cancelled']).default('draft'),
  note: z.string().optional().nullable(),
});

export interface SupplierOverviewDto {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export interface SupplierDetailTabCountsDto {
  contracts: number;
  evaluations: number;
  orders: number;
}

export interface SupplierDetailDto {
  id: number;
  name: string;
  supplier_code: string;
  type?: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  representative_name?: string;
  logo_url?: string;
  is_active: number;
  rating_avg: number;
  rating_count: number;
  total_contract_value: number;
  tab_counts: SupplierDetailTabCountsDto;
}

export interface SupplierContractListItemDto {
  id: number;
  contract_no: string;
  contract_type?: string | null;
  start_date: string;
  end_date: string;
  value_amount: number;
  status: string;
  remaining_days: number;
}

export type SupplierContractDto = z.infer<typeof SupplierContractSchema>;
export type SupplierOrderDto = z.infer<typeof SupplierOrderSchema>;
