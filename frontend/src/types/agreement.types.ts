import type { TENANT_AGREEMENT } from "./tenant.types";

export interface BULK_RENT_ADJUST_RESULT {
  tenants_adjusted: number;
  new_agreements: TENANT_AGREEMENT[];
}
