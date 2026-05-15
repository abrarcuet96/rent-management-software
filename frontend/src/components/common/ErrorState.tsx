import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "কিছু একটা ভুল হয়েছে",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle size={40} className="text-danger mb-3" />
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          আবার চেষ্টা করুন
        </Button>
      )}
    </div>
  );
}
