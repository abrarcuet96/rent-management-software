import { getExpenses, deleteExpense } from "@/api/expenses.api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ExpenseFormDialog from "./ExpenseFormDialog";
import { getFallback } from "@/lib/getFallback";

export default function ExpensesTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses({ page: 1, page_size: 100 }),
  });

  const expenses: Expense[] = data?.data.data ?? [];

  const { mutate: removeExpense, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("খরচ ডিঅ্যাক্টিভেট হয়েছে");
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
          <table className="w-full text-sm">
            <thead className="bg-neutral-bg">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">
                  বিবরণ
                </th>
                <th className="text-right px-3 py-2 font-medium text-text-secondary">
                  পরিমাণ
                </th>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">
                  তারিখ
                </th>
                <th className="text-center px-3 py-2 font-medium text-text-secondary">
                  প্রকার
                </th>
                <th className="text-right px-3 py-2 font-medium text-text-secondary">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.public_id} className="border-t border-border hover:bg-neutral-bg">
                  <td className="px-3 py-2.5 text-text-primary">
                    <div>
                      <span>{expense.description}</span>
                      {expense.is_tenant_charged && (
                        <span className="ml-2 text-xs bg-warning-bg text-warning rounded-full px-2 py-0.5">
                          ভাড়াটে
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-danger font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary">
                    {expense.expense_date}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {expense.building_public_id ? (
                      <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                        বিল্ডিং
                      </span>
                    ) : (
                      <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                        সাধারণ
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          description={`"${deleteTarget.description}" খরচটি ডিঅ্যাক্টিভেট করবেন?`}
          confirmLabel="ডিলিট"
          variant="danger"
          isPending={deleting}
          onConfirm={() => removeExpense(deleteTarget.public_id)}
        />
      )}
    </div>
  );
}
