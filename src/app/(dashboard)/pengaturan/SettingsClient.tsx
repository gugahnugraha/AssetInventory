"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Settings, 
  Building2, 
  HardDrive, 
  Database, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOpdAction } from "@/actions/opd";
import { Role } from "@prisma/client";

const opdSchema = z.object({
  nama: z.string().min(1, "Nama instansi wajib diisi"),
  kode: z.string().min(3, "Kode instansi minimal 3 karakter").toUpperCase().trim(),
  kodeNumeric: z.string().trim().optional(),
});

type OpdFormValues = z.infer<typeof opdSchema>;

interface SettingsClientProps {
  opd: {
    id: string;
    nama: string;
    kode: string;
    kodeNumeric?: string;
  };
  isR2Configured: boolean;
  userRole: Role;
}

export function SettingsClient({ opd, isR2Configured, userRole }: SettingsClientProps) {
  const router = useRouter();
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isAdmin = userRole === Role.ADMINISTRATOR;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpdFormValues>({
    resolver: zodResolver(opdSchema),
    defaultValues: {
      nama: opd.nama,
      kode: opd.kode,
      kodeNumeric: opd.kodeNumeric || "",
    },
  });

  const onSubmit = async (values: OpdFormValues) => {
    if (!isAdmin) return;
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await updateOpdAction(opd.id, values.nama, values.kode, values.kodeNumeric);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setSuccess("Pengaturan instansi berhasil diperbarui.");
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan pengaturan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Pengaturan Sistem</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola parameter nama instansi pemerintah daerah dan pantau status runtime server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instansi Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Pengaturan Instansi OPD
              </CardTitle>
              <CardDescription>
                Sesuaikan nama Dinas/Badan/Kantor penanggung jawab aplikasi inventaris ini.
              </CardDescription>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Nama Lengkap Instansi (OPD)
                  </label>
                  <Input 
                    disabled={!isAdmin} 
                    className={!isAdmin ? "bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-75" : ""} 
                    {...register("nama")} 
                  />
                  {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Singkatan / Kode Instansi
                  </label>
                  <Input 
                    disabled={!isAdmin} 
                    className={(!isAdmin ? "bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-75 " : "") + "font-mono"} 
                    {...register("kode")} 
                  />
                  {errors.kode && <p className="text-xs text-rose-500 mt-1">{errors.kode.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Kode Numerik Instansi (OPD)
                  </label>
                  <Input 
                    placeholder="Contoh: 21.02.01.01"
                    disabled={!isAdmin} 
                    className={(!isAdmin ? "bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-75 " : "") + "font-mono"} 
                    {...register("kodeNumeric")} 
                  />
                  {errors.kodeNumeric && <p className="text-xs text-rose-500 mt-1">{errors.kodeNumeric.message}</p>}
                </div>

                {isAdmin ? (
                  <div className="border-t pt-4 mt-6 flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs disabled:pointer-events-none">
                      {isSubmitting ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Menyimpan...
                        </span>
                      ) : (
                        "Simpan Pengaturan"
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-medium italic">
                    * Hanya Administrator yang diizinkan untuk menyunting nama dan kode instansi.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Runtime Diagnostics (Right column) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 h-full">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Settings className="h-5 w-5 text-emerald-600" />
                Diagnostik Server
              </CardTitle>
              <CardDescription>Status runtime server-side dan database.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {/* Media storage */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60">
                <HardDrive className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Penyimpanan Media</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {isR2Configured ? "Cloudflare R2 Active" : "Local Disk Storage"}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    {isR2Configured 
                      ? "Penyimpanan cloud berbasis obyek S3 Cloudflare aktif." 
                      : "Penyimpanan lokal di folder public/uploads/ (mode pengembangan)."}
                  </p>
                </div>
              </div>

              {/* Database */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60">
                <Database className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Database Driver</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    PostgreSQL Client (Wasm)
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    Prisma 7 Wasm engine dengan driver adapter Pool pg PostgreSQL Neon.
                  </p>
                </div>
              </div>

              {/* Authentication */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Autentikasi</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    Auth.js JWT Session
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    Middleware proteksi rute dengan JWT token terenkripsi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
