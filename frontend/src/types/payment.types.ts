export interface PAYMENT_RECORD {
  public_id: string;
  due_public_id: string;
  amount_paid: number;
  paid_on: string;
  note?: string;
  is_active: boolean;
  is_bulk: boolean;
  created_at: string;
}

export interface BULK_PAYMENT_DUE_UPDATE {
  due_public_id: string;
  month: number;
  year: number;
  applied_amount: number;
  new_status: "partial" | "paid";
}

export interface BULK_PAYMENT_RESULT {
  total_applied: number;
  unapplied: number;
  dues_cleared: number;
  dues_partially_paid: number;
  dues_updated: BULK_PAYMENT_DUE_UPDATE[];
  payment_records: PAYMENT_RECORD[];
}

export interface BULK_HISTORY_DUE_DETAIL {
  due_public_id: string;
  month: number;
  year: number;
  amount_applied: number;
  new_status: string;
}

export interface BULK_PAYMENT_HISTORY_ITEM {
  paid_on: string;
  note: string | null;
  tenant_public_id: string;
  tenant_name: string;
  total_amount: number;
  dues: BULK_HISTORY_DUE_DETAIL[];
}
