"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginClient() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);

    try {
      const response = await loginAction(formData);
      if (response?.error) {
        setError(response.error);
        setLoading(false);
      } else if (response?.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Login client submit error:", err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95 duration-300">
      <Card className="w-full border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs">
        <CardHeader className="space-y-2 text-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xs">
              <Shield className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
            SIM Inventaris Aset
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
            Pemerintah Daerah Kabupaten Bandung
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                placeholder="Masukkan username"
                autoComplete="username"
                disabled={loading}
                className={errors.username ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-rose-500 font-medium">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className={errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-emerald-600/20 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-medium select-none tracking-wider opacity-85">
        &copy; {new Date().getFullYear()} Pemerintah Daerah Kabupaten Bandung. All Rights Reserved.
      </div>
    </div>
  );
}
