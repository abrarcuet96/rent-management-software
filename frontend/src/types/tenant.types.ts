export interface TENANT {
  public_id: string;
  apartment_public_id: string;
  building_name: string;
  apartment_unit_number: string;
  full_name: string;
  phone: string;
  nid_number?: string;
  address?: string;
  member_count: number;
  move_in_date: string;
  move_out_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface TENANT_AGREEMENT {
  public_id: string;
  tenant_public_id: string;
  rent_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}
