import { AxiosError } from "axios";
import toast from "react-hot-toast";

interface FallbackOptions {
  error: AxiosError<{ message?: string; detail?: string }>;
  fallbackMessage?: string;
}

export function getFallback({
  error,
  fallbackMessage = "কিছু একটা ভুল হয়েছে",
}: FallbackOptions): void {
  const message =
    error.response?.data?.message ||
    error.response?.data?.detail ||
    error.message ||
    fallbackMessage;
  toast.error(message);
}
