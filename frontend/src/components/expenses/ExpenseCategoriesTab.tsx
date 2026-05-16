import {
  getExpenseCategories,
  deleteExpenseCategory,
} from "@/api/expenses.api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import type { ExpenseCategory } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import CreateCategoryDialog from "./CreateCategoryDialog";
import { getFallback } from "@/lib/getFallback";

export default function ExpenseCategoriesTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<ExpenseCategory | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories({ page: 1, page_size: 100 }),
  });

  const categories: ExpenseCategory[] = data?.data.data ?? [];

  const { mutate: removeCategory, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("ক্যাটাগরি ডিঅ্যাক্টিভেট হয়েছে");
      setDeleteCategory(null);
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
          খরচের ক্যাটাগরি ({data?.data?.pagination?.total ?? 0})
        </h3>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Plus size={16} className="mr-1.5" />
          নতুন ক্যাটাগরি
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-neutral-bg rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="কোনো ক্যাটাগরি নেই"
          description="নতুন ক্যাটাগরি তৈরি করতে উপরের বাটনে ক্লিক করুন"
          icon={<Tags size={40} />}
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} className="mr-1.5" />
              নতুন ক্যাটাগরি
            </Button>
          }
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-bg">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">
                  নাম
                </th>
                <th className="text-center px-3 py-2 font-medium text-text-secondary">
                  ডিফল্ট
                </th>
                <th className="text-right px-3 py-2 font-medium text-text-secondary">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.public_id} className="border-t border-border">
                  <td className="px-3 py-2.5 text-text-primary">{cat.name}</td>
                  <td className="px-3 py-2.5 text-center">
                    {cat.is_default ? (
                      <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                        ডিফল্ট
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {!cat.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-danger hover:text-danger"
                        onClick={() => setDeleteCategory(cat)}
                      >
                        <Trash2 size={13} className="mr-1" />
                        ডিলিট
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />

      {deleteCategory && (
        <ConfirmDialog
          open={!!deleteCategory}
          onOpenChange={(open) => {
            if (!open) setDeleteCategory(null);
          }}
          title="ক্যাটাগরি ডিলিট করুন"
          description={`"${deleteCategory.name}" ক্যাটাগরিটি ডিঅ্যাক্টিভেট করবেন?`}
          confirmLabel="ডিলিট"
          variant="danger"
          isPending={deleting}
          onConfirm={() => removeCategory(deleteCategory.public_id)}
        />
      )}
    </div>
  );
}
