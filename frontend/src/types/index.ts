export interface Owner {
  public_id: string;
  full_name: string;
  email: string;
}

export interface Building {
  public_id: string;
  name: string;
  address: string;
  total_floors: number;
  is_active: boolean;
  created_at: string;
}

export interface Apartment {
  public_id: string;
  building_public_id: string;
  unit_number: string;
  floor: number;
  status: "vacant" | "occupied";
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
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

export interface TenantAgreement {
  public_id: string;
  tenant_public_id: string;
  rent_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface MonthlyDue {
  public_id: string;
  tenant_public_id: string;
  agreement_public_id: string;
  month: number;
  year: number;
  rent_amount: string;
  total_due: string;
  amount_paid: string;
  remaining_balance: string;
  status: "unpaid" | "partial" | "paid";
  is_auto_generated: boolean;
  due_date?: string;
  created_at: string;
}

export interface PaymentRecord {
  public_id: string;
  due_public_id: string;
  amount_paid: number;
  paid_on: string;
  note?: string;
  is_active: boolean;
  is_bulk: boolean;
  created_at: string;
}

export interface ExpenseCategory {
  public_id: string;
  name: string;
  is_default: boolean;
}

export interface Expense {
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

export interface DashboardSummary {
  total_collected: number;
  total_outstanding: number;
  vacant_apartments: number;
  occupied_apartments: number;
  total_expenses: number;
  net_profit: number;
  month: number;
  year: number;
}

export interface BulkPaymentResult {
  total_applied: number;
  unapplied: number;
  dues_cleared: number;
  dues_partially_paid: number;
  dues_updated: BulkPaymentDueUpdate[];
  payment_records: PaymentRecord[];
}

export interface BulkPaymentDueUpdate {
  due_public_id: string;
  month: number;
  year: number;
  applied_amount: number;
  new_status: "partial" | "paid";
}

export interface BulkRentAdjustResult {
  tenants_adjusted: number;
  new_agreements: TenantAgreement[];
}

export interface BulkPaymentHistoryItem {
  paid_on: string;
  note: string | null;
  tenant_public_id: string;
  tenant_name: string;
  total_amount: number;
  dues: BulkHistoryDueDetail[];
}

export interface BulkHistoryDueDetail {
  due_public_id: string;
  month: number;
  year: number;
  amount_applied: number;
  new_status: string;
}

export interface BulkDueGenerateResult {
  created: number;
  skipped: number;
  no_agreement: number;
}

export interface PendingDueCount {
  pending: number;
  already_has_due: number;
  no_agreement: number;
  month: number;
  year: number;
}

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
  message: string;
}
