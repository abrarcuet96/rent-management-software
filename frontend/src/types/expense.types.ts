export interface EXPENSE_CATEGORY {
  public_id: string;
  name: string;
  is_default: boolean;
}

export interface EXPENSE {
  public_id: string;
  category_public_id: string;
  building_public_id?: string;
  apartment_public_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  is_tenant_charged: boolean;
  charged_tenant_public_ids: string[];
}
