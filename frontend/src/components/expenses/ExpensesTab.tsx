import { getExpenses, deleteExpense } from "@/api/expenses.api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { EXPENSE } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetchData } from "@/hooks/useFetchData";
import type { AxiosError } from "axios";
import { Pencil, Plus, Receipt, Trash2, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ExpenseFormDialog from "./ExpenseFormDialog";
import ChargeTenantsDialog from "./ChargeTenantsDialog";
import { getFallback } from "@/lib/getFallback";

export default function ExpensesTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<EXPENSE | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EXPENSE | null>(null);
  const [chargeTarget, setChargeTarget] = useState<EXPENSE | null>(null);

  const { data, isLoading, error, refetch } = useFetchData({
    queryKey: ["expenses"],
    queryFn: () => getExpenses({ page: 1, page_size: 100 }),
  });

  const expenses: EXPENSE[] = data?.data.data ?? [];

  const { mutate: removeExpense, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("খরচ মুছে ফেলা হয়েছে");
      setDeleteTarget(null);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-text-primary">
          খরচ ({data?.data.pagination.total ?? 0})
        </h3>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Plus size={16} className="mr-1.5" />
          নতুন খরচ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-neutral-bg rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="কোনো খরচ নেই"
          description="নতুন খরচ যোগ করতে উপরের বাটনে ক্লিক করুন"
          icon={<Receipt size={40} />}
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} className="mr-1.5" />
              নতুন খরচ
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <Table className="text-sm">
            <TableHeader className="bg-neutral-bg">
              <TableRow>
                <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">
                  বিবরণ
                </TableHead>
                <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
                  পরিমাণ
                </TableHead>
                <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">
                  তারিখ
                </TableHead>
                <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">
                  প্রকার
                </TableHead>
                <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
                  অ্যাকশন
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.public_id} className="border-t border-border hover:bg-neutral-bg">
                  <TableCell className="px-3 py-2.5 text-text-primary">
                    <div>
                      <span>{expense.description}</span>
                      {expense.is_tenant_charged && (
                        <span className="ml-2 text-xs bg-warning-bg text-warning rounded-full px-2 py-0.5">
                          ভাড়াটে
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right text-danger font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-text-secondary">
                    {expense.expense_date}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center">
                    {expense.building_public_id ? (
                      <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                        বিল্ডিং
                      </span>
                    ) : (
                      <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                        সাধারণ
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {expense.is_tenant_charged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:text-primary"
                          onClick={() => setChargeTarget(expense)}
                        >
                          <Users size={13} className="mr-1" />
                          চার্জ
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setEditExpense(expense)}
                      >
                        <Pencil size={13} className="mr-1" />
                        সম্পাদনা
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-danger hover:text-danger"
                        onClick={() => setDeleteTarget(expense)}
                      >
                        <Trash2 size={13} className="mr-1" />
                        ডিলিট
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExpenseFormDialog
        open={createOpen || !!editExpense}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditExpense(null);
          }
        }}
        expense={editExpense ?? undefined}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="খরচ ডিলিট করুন"
          description={`"${deleteTarget.description}" খরচটি মুছে ফেলবেন?`}
          confirmLabel="ডিলিট"
          variant="danger"
          isPending={deleting}
          onConfirm={() => removeExpense(deleteTarget.public_id)}
        />
      )}

      <ChargeTenantsDialog
        expense={chargeTarget}
        open={!!chargeTarget}
        onOpenChange={(open) => {
          if (!open) setChargeTarget(null);
        }}
      />
    </div>
  );
}
