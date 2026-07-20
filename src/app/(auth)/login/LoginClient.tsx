"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { loginAction } from "@/actions/auth";
import { APP_NAME, APP_FULL_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, AlertCircle, Loader2, User, Lock, Sparkles, Database, CheckCircle2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginClient() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

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
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-white font-sans overflow-hidden relative">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(4,120,87,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />

      {/* LEFT PANEL - BRANDING & STATS PREVIEW (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 border-r border-zinc-800/40 relative overflow-hidden bg-zinc-950/40">
        {/* Glow orb */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 right-0 w-80 h-80 rounded-full bg-emerald-700/5 blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
            {APP_NAME}
          </span>
        </div>

        {/* Hero Slogan */}
        <div className="space-y-6 my-auto relative z-10 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>{APP_FULL_NAME}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-zinc-50">
            Kelola Aset SKPD Lebih Cerdas &amp; Akurat.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {APP_FULL_NAME} terintegrasi untuk penatausahaan, mutasi, pelaporan, dan rekonsiliasi barang milik daerah secara real-time.
          </p>

          {/* Glowing Mock Stats Card */}
          <div className="pt-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-xs shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-emerald-400" /> Database Terhubung</span>
                <span className="font-mono text-emerald-400 font-semibold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-300">System Uptime:</span>
                <span className="text-sm font-extrabold text-emerald-400">99.8%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99.8%] rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Terintegrasi dengan Cloudflare R2 &amp; Audit Log</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-zinc-500 relative z-10 font-medium">
          Made with ♥ by <span className="text-emerald-400 font-semibold">Gugah Nugraha</span>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN CARD FORM */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        {/* Glow orb for mobile layout */}
        <div className="absolute w-72 h-72 rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-[420px] flex flex-col items-center gap-6 animate-in fade-in duration-500 slide-in-from-bottom-4">

          {/* Logo on Mobile */}
          <div className="flex flex-col items-center gap-2 lg:hidden mb-2">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-lg">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-black tracking-wider text-emerald-400">{APP_NAME}</h1>
            <p className="text-xs text-zinc-550">{APP_FULL_NAME}</p>
          </div>

          <Card className="w-full border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-8 space-y-6">

              {/* Header Title inside Card */}
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-bold tracking-tight text-zinc-50">Selamat Datang</h3>
                <p className="text-xs text-zinc-500">Masukkan kredensial untuk masuk ke aplikasi</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/30 text-xs font-semibold animate-in shake duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Masukkan username"
                      autoComplete="username"
                      disabled={loading}
                      className={`pl-10.5 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500/40 focus:border-emerald-500/50 ${errors.username ? "border-rose-500 focus-visible:ring-rose-500/40 focus:border-rose-500" : ""
                        }`}
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-rose-400 font-medium mt-1">{errors.username.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loading}
                      className={`pl-10.5 pr-10 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500/40 focus:border-emerald-500/50 ${errors.password ? "border-rose-500 focus-visible:ring-rose-500/40 focus:border-rose-500" : ""
                        }`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 focus:outline-hidden disabled:pointer-events-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-400 font-medium mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-emerald-600/20 active:scale-[0.99] disabled:pointer-events-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Mini copyright */}
          <div className="text-center text-[10px] text-zinc-600 dark:text-zinc-500 font-medium select-none tracking-wider opacity-85 mt-2">
            Made with ♥ by <span className="text-emerald-450 dark:text-emerald-400 font-semibold">Gugah Nugraha</span> &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
