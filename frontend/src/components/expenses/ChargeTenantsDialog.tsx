import { chargeExpenseToTenants } from "@/api/expenses.api";
import { getActiveTenant, getTenants } from "@/api/tenants.api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getFallback } from "@/lib/getFallback";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Tenant } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ChargeTenantsDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChargeTenantsDialog({
  expense,
  open,
  onOpenChange,
}: ChargeTenantsDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const scope = useMemo(() => {
    if (!expense) return null;
    if (expense.apartment_public_id) return "apartment";
    if (expense.building_public_id) return "building";
    return null;
  }, [expense]);

  // Fetch tenants based on scope
  const { data: activeTenantData, isLoading: loadingApt } = useQuery({
    queryKey: ["active-tenant", expense?.apartment_public_id],
    queryFn: () => getActiveTenant(expense!.apartment_public_id!),
    enabled: open && scope === "apartment" && !!expense?.apartment_public_id,
  });

  const { data: buildingTenantsData, isLoading: loadingBldg } = useQuery({
    queryKey: ["tenants", "building", expense?.building_public_id],
    queryFn: () =>
      getTenants({
        building_public_id: expense!.building_public_id,
        status: "active",
        page: 1,
        page_size: 100,
      }),
    enabled: open && scope === "building" && !!expense?.building_public_id,
  });

  const tenants: Tenant[] = useMemo(() => {
    if (scope === "apartment") {
      const t = activeTenantData?.data?.data;
      return t ? [t] : [];
    }
    if (scope === "building") {
      return buildingTenantsData?.data?.data ?? [];
    }
    return [];
  }, [scope, activeTenantData, buildingTenantsData]);

  const isLoading = scope === "apartment" ? loadingApt : loadingBldg;

  const alreadyCharged = useMemo(
    () => new Set(expense?.charged_tenant_public_ids ?? []),
    [expense],
  );

  // Auto-selected tenant IDs (apartment scope, not yet charged)
  const autoSelectedIds = useMemo(() => {
    if (scope !== "apartment" || tenants.length === 0) return new Set<string>();
    const t = tenants[0];
    if (t && !alreadyCharged.has(t.public_id)) return new Set([t.public_id]);
    return new Set<string>();
  }, [scope, tenants, alreadyCharged]);

  // Effective selection: auto-selected XOR user toggles
  const effectiveSelection = useMemo(() => {
    const result = new Set(autoSelectedIds);
    for (const id of selected) {
      if (result.has(id)) result.delete(id);
      else result.add(id);
    }
    return result;
  }, [autoSelectedIds, selected]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setSelected(new Set());
    onOpenChange(newOpen);
  };

  const toggleTenant = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const unchargedIds = tenants
      .filter((t) => !alreadyCharged.has(t.public_id))
      .map((t) => t.public_id);
    // selected represents "toggled on" vs autoSelectedIds
    // For building scope: autoSelectedIds is empty, set selected = unchargedIds
    // For apartment scope: autoSelectedIds already has the tenant, so clear overrides
    const result = new Set<string>();
    for (const id of unchargedIds) {
      if (!autoSelectedIds.has(id)) result.add(id);
    }
    setSelected(result);
  };

  const deselectAll = () => setSelected(new Set());

  const uncharged = tenants.filter((t) => !alreadyCharged.has(t.public_id));

  const allSelected =
    uncharged.length > 0 &&
    uncharged.every((t) => effectiveSelection.has(t.public_id));

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      chargeExpenseToTenants(
        expense!.public_id,
        Array.from(effectiveSelection),
      ),
    onSuccess: (res) => {
      const { charged, skipped } = res.data.data;
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      if (charged > 0) {
        toast.success(`${charged} জনকে সফলভাবে চার্জ করা হয়েছে`);
      } else {
        toast(`${skipped} জন ইতিমধ্যে চার্জ করা আছে বা এই মাসের ডিউ নেই`);
      }
      handleOpenChange(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  const handleSubmit = () => {
    if (effectiveSelection.size === 0) {
      toast.error("কমপক্ষে একজন ভাড়াটে নির্বাচন করুন");
      return;
    }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} />
            ভাড়াটেদের চার্জ করুন
          </DialogTitle>
        </DialogHeader>

        {expense && (
          <div className="bg-neutral-bg rounded-lg p-3 text-sm mb-2">
            <p className="font-medium text-text-primary">
              {expense.description}
            </p>
            <p className="text-danger font-semibold mt-0.5">
              {formatCurrency(expense.amount)}
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              তারিখ: {expense.expense_date}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-text-secondary text-sm">
            <Loader2 size={16} className="animate-spin" />
            লোড হচ্ছে...
          </div>
        ) : tenants.length === 0 ? (
          <p className="text-center text-sm text-text-secondary py-6">
            এই স্কোপে কোনো সক্রিয় ভাড়াটে নেই
          </p>
        ) : (
          <>
            {scope === "building" && uncharged.length > 1 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">
                  {effectiveSelection.size} জন নির্বাচিত
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={allSelected ? deselectAll : selectAll}
                >
                  {allSelected ? "সব বাতিল করুন" : "সবাই নির্বাচন করুন"}
                </Button>
              </div>
            )}

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {tenants.map((tenant) => {
                const charged = alreadyCharged.has(tenant.public_id);
                const isChecked =
                  charged || effectiveSelection.has(tenant.public_id);
                return (
                  <Label
                    key={tenant.public_id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border transition-colors font-normal leading-normal ${
                      charged
                        ? "bg-neutral-bg opacity-60 cursor-not-allowed"
                        : "hover:bg-neutral-bg cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={charged}
                      onCheckedChange={() => {
                        if (!charged) toggleTenant(tenant.public_id);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {tenant.full_name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {tenant.building_name} — ইউনিট{" "}
                        {tenant.apartment_unit_number}
                        {charged && (
                          <span className="ml-2 text-success font-medium">
                            ✓ চার্জ হয়েছে
                          </span>
                        )}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            বাতিল
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isPending || effectiveSelection.size === 0 || isLoading}
            onClick={handleSubmit}
          >
            {isPending && <Loader2 size={14} className="animate-spin mr-1.5" />}
            চার্জ করুন ({effectiveSelection.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
