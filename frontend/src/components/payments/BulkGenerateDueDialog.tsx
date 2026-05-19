import { generateBulkDue, getPendingDueCount } from "@/api/dues.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFallback } from "@/lib/getFallback";
import type { PendingDueCount } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface BulkGenerateDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export default function BulkGenerateDueDialog({
  open,
  onOpenChange,
}: BulkGenerateDueDialogProps) {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dueDate, setDueDate] = useState("");
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    no_agreement: number;
  } | null>(null);

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const now = new Date();
      setMonth(now.getMonth() + 1);
      setYear(now.getFullYear());
      setDueDate("");
      setResult(null);
    }
    onOpenChange(newOpen);
  };

  const { data: countData, isLoading: countLoading } = useQuery({
    queryKey: ["pending-due-count", month, year],
    queryFn: () => getPendingDueCount(month, year),
    enabled: open,
  });

  const count: PendingDueCount | undefined = countData?.data.data;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      generateBulkDue({
        month,
        year,
        due_date: dueDate || undefined,
      }),
    onSuccess: (res) => {
      const data = res.data.data;
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["pending-due-count"] });
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(res.data.message || `${data.created} টি ডিউ তৈরি হয়েছে`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  const pending = count?.pending ?? 0;
  const canGenerate = pending > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>মাসিক ডিউ তৈরি করুন</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month selector */}
          <div>
            <Label>
              মাস <span className="text-danger">*</span>
            </Label>
            <Select
              value={String(month)}
              onValueChange={(v) => {
                setMonth(Number(v));
                setResult(null);
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year selector */}
          <div>
            <Label>
              বছর <span className="text-danger">*</span>
            </Label>
            <Select
              value={String(year)}
              onValueChange={(v) => {
                setYear(Number(v));
                setResult(null);
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(
                  (y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div>
            <Label>ডিউ তারিখ (ঐচ্ছিক)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Preview */}
          {countLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-text-secondary" />
            </div>
          ) : count ? (
            <div className="bg-neutral-bg rounded-lg p-4 space-y-2 text-sm">
              {pending > 0 ? (
                <div className="flex items-start gap-2 text-warning">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>{pending}</strong> জন ভাড়াটের ডিউ তৈরি করা বাকি
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-success">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span>এই মাসের সবার ডিউ তৈরি করা আছে</span>
                </div>
              )}
              {count.already_has_due > 0 && (
                <div className="flex items-start gap-2 text-text-secondary">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>{count.already_has_due}</strong> জনের ইতিমধ্যে ডিউ
                    আছে
                  </span>
                </div>
              )}
              {count.no_agreement > 0 && (
                <div className="flex items-start gap-2 text-text-secondary">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>{count.no_agreement}</strong> জনের কোনো active
                    চুক্তি নেই
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* Result after generation */}
          {result && (
            <div className="bg-success-bg border border-success/20 rounded-lg p-4 space-y-1 text-sm">
              <p className="font-medium text-success">
                <CheckCircle size={14} className="inline mr-1" />
                {result.created} টি ডিউ তৈরি হয়েছে
              </p>
              {result.skipped > 0 && (
                <p className="text-text-secondary">
                  {result.skipped} টি পূর্বে তৈরি করা ছিল
                </p>
              )}
              {result.no_agreement > 0 && (
                <p className="text-text-secondary">
                  {result.no_agreement} জনের চুক্তি নেই
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => mutate()}
              disabled={isPending || !canGenerate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending && (
                <Loader2 size={16} className="animate-spin mr-1.5" />
              )}
              {canGenerate ? `ডিউ তৈরি করুন (${pending})` : "ডিউ তৈরি করুন"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
