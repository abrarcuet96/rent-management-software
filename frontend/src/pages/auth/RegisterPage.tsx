import { registerOwner } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "" },
  });

  // Clear server error whenever the user edits any field
  useEffect(() => {
    const { unsubscribe } = form.watch(() => {
      if (form.formState.errors.root) {
        form.clearErrors("root");
      }
    });
    return unsubscribe;
  }, [form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterInput) =>
      registerOwner({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      }),
    onSuccess: (res) => {
      const token = res.data.data.access_token;
      const payload = decodeJwtPayload(token);
      setAuth(token, {
        public_id: (payload.sub as string) ?? "",
        full_name: (payload.full_name as string) ?? form.getValues("full_name"),
        email: (payload.email as string) ?? form.getValues("email"),
      });
      toast.success(res.data.message || "নিবন্ধন সফল");
      navigate("/dashboard", { replace: true });
    },
    onError: (error: AxiosError<{ message?: string; detail?: string }>) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      form.setError("root", { message });
    },
  });

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D4A38] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 size={28} className="text-white" />
            </div>
            <span className="text-4xl font-bold text-white tracking-tight">RentFlow</span>
          </div>
          <p className="text-white/70 text-xl leading-relaxed max-w-sm">
            আপনার সম্পত্তি পরিচালনা করুন সহজে
          </p>
          <p className="text-white/40 text-sm mt-4 max-w-xs mx-auto">
            বিল্ডিং, অ্যাপার্টমেন্ট, ভাড়াটে এবং পেমেন্ট — সব এক জায়গায়
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start md:items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md pt-8 md:pt-0">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={20} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">RentFlow</span>
          </div>

          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-foreground">
                নিবন্ধন করুন
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                নতুন অ্যাকাউন্ট তৈরি করুন
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => mutate(data))}
                  className="space-y-4"
                >
                  <FormInput
                    form={form}
                    name="full_name"
                    label="পূর্ণ নাম"
                    placeholder="আপনার পূর্ণ নাম"
                    autoComplete="name"
                  />

                  <FormInput
                    form={form}
                    name="email"
                    label="ইমেইল"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                  />

                  <FormInput
                    form={form}
                    name="password"
                    label="পাসওয়ার্ড"
                    type="password"
                    placeholder="কমপক্ষে ৮ অক্ষর"
                    autoComplete="new-password"
                  />

                  <FormInput
                    form={form}
                    name="confirmPassword"
                    label="পাসওয়ার্ড নিশ্চিত করুন"
                    type="password"
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    autoComplete="new-password"
                  />

                  {/* Server-side error */}
                  {form.formState.errors.root && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-bg px-3 py-2.5 text-sm text-danger">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{form.formState.errors.root.message}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        নিবন্ধন হচ্ছে...
                      </>
                    ) : (
                      "নিবন্ধন করুন"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  লগইন করুন
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
