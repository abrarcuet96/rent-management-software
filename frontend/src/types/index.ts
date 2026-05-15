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
  rent_amount: number;
  total_due: number;
  amount_paid: number;
  remaining_balance: number;
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
  created_at: string;
}

export interface ExpenseCategory {
  public_id: string;
  owner_id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Expense {
  public_id: string;
  category_id: string;
  description?: string;
  amount: number;
  expense_date: string;
  scope: "building" | "apartment";
  is_tenant_charged: boolean;
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
  dues_cleared: number;
  dues_partially_paid: number;
  payment_records: PaymentRecord[];
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
