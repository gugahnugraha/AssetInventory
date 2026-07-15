"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, 
  Shield, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateUserAction } from "@/actions/user";
import { Role } from "@prisma/client";

const profileSchema = z.object({
  nama: z.string().min(1, "Nama lengkap wajib diisi"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: "Password baru minimal 6 karakter",
  path: ["password"],
}).refine((data) => {
  return data.password === data.confirmPassword;
}, {
  message: "Konfirmasi password baru tidak cocok",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileClientProps {
  user: {
    id: string;
    nama: string;
    username: string;
    role: Role;
    opdName: string;
    opdKode: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama: user.nama,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await updateUserAction(user.id, {
        nama: values.nama,
        password: values.password || undefined,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setSuccess("Profil Anda berhasil diperbarui.");
        reset({
          nama: values.nama,
          password: "",
          confirmPassword: "",
        });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memperbarui profil.");
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR:
        return "Administrator";
      case Role.OPERATOR:
        return "Operator Aset";
      case Role.MANAGER:
        return "Manager (Read-Only)";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6 pt-0 pb-8 -mt-6 max-w-3xl">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">Profil Saya</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Perbarui informasi nama profil dan ganti kata sandi akun Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Box */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center border font-bold text-2xl">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">{user.nama}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">@{user.username}</p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
              {getRoleLabel(user.role)}
            </Badge>
            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
            <div className="text-left w-full space-y-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div>
                <span className="text-[10px] text-zinc-400">Instansi OPD</span>
                <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-0.5 truncate">{user.opdName}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400">Kode OPD</span>
                <p className="text-sm font-mono text-zinc-850 dark:text-zinc-200 mt-0.5">{user.opdKode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Box */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 md:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Sunting Informasi Profil</CardTitle>
            <CardDescription>Ubah nama atau ubah password login Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
                <Input {...register("nama")} />
                {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Username Login</label>
                <Input value={user.username} disabled className="bg-zinc-50 font-mono opacity-60" />
                <p className="text-[10px] text-zinc-400 mt-1">* Username bersifat unik dan tidak dapat diubah.</p>
              </div>

              <div className="border-t pt-4 mt-6 space-y-4">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Ubah Kata Sandi Akun
                </h4>
                <p className="text-xs text-zinc-500">Isi kolom di bawah jika Anda berniat merubah kata sandi lama Anda.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Password Baru</label>
                    <Input type="password" placeholder="••••••••" {...register("password")} />
                    {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Konfirmasi Password Baru</label>
                    <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
                    {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-6 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs disabled:pointer-events-none">
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
