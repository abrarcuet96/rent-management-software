import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const SIZE_MAP = { sm: 16, md: 24, lg: 36 } as const;

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <Loader2 size={SIZE_MAP[size]} className="animate-spin text-primary" />
    </div>
  );
}
