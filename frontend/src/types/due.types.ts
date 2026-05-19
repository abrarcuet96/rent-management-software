export interface MONTHLY_DUE {
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

export interface PENDING_DUE_COUNT {
  pending: number;
  already_has_due: number;
  no_agreement: number;
  month: number;
  year: number;
}

export interface BULK_DUE_GENERATE_RESULT {
  created: number;
  skipped: number;
  no_agreement: number;
}
