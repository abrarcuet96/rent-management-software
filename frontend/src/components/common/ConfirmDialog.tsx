import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  isPending?: boolean;
  confirmLabel?: string;
  variant?: "default" | "danger";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
  confirmLabel = "নিশ্চিত করুন",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            বাতিল করুন
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              variant === "danger" && "bg-destructive hover:bg-destructive/90 text-white",
            )}
          >
            {isPending && <Loader2 size={16} className="animate-spin mr-1" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
