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
  AlertCircle,
  Download,
  Upload,
  ShieldAlert
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOpdAction } from "@/actions/opd";
import { exportBackupAction, importBackupAction } from "@/actions/backup";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
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

  const [backupSuccess, setBackupSuccess] = React.useState<string | null>(null);
  const [backupError, setBackupError] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = React.useState(false);
  const [uploadedJsonContent, setUploadedJsonContent] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    if (userRole === Role.DEMO) {
      setBackupError("Demo Only: Anda tidak diizinkan melakukan perubahan.");
      return;
    }
    if (!isAdmin) return;
    setIsExporting(true);
    setBackupSuccess(null);
    setBackupError(null);

    try {
      const res = await exportBackupAction();
      if (res.error) {
        setBackupError(res.error);
      } else if (res.backupData) {
        const dataStr = JSON.stringify(res.backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement("a");
        link.href = url;
        const dateStr = new Date().toISOString().split("T")[0];
        link.download = `Backup_SIM_Aset_${opd.kode}_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);

        setBackupSuccess("Ekspor data berhasil. File cadangan telah diunduh.");
      }
    } catch (err) {
      console.error(err);
      setBackupError("Gagal mengekspor data cadangan.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setBackupSuccess(null);
    setBackupError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedJsonContent(content);
    };
    reader.onerror = () => {
      setBackupError("Gagal membaca file unggahan.");
    };
    reader.readAsText(file);
  };

  const handleRestoreConfirmed = async () => {
    if (userRole === Role.DEMO) {
      setBackupError("Demo Only: Anda tidak diizinkan melakukan perubahan.");
      return;
    }
    if (!isAdmin || !uploadedJsonContent) return;
    setShowRestoreConfirm(false);
    setIsImporting(true);
    setBackupSuccess(null);
    setBackupError(null);

    try {
      const res = await importBackupAction(uploadedJsonContent);
      if (res.error) {
        setBackupError(res.error);
      } else if (res.success) {
        setBackupSuccess("Pemulihan data berhasil diselesaikan. Seluruh database telah diperbarui.");
        setUploadedJsonContent(null);
        setUploadedFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setBackupError("Gagal memulihkan database dari berkas cadangan.");
    } finally {
      setIsImporting(false);
    }
  };

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
    if (userRole === Role.DEMO) {
      setError("Demo Only: Anda tidak diizinkan melakukan perubahan.");
      return;
    }
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
    <div className="space-y-4 pt-0 pb-8 max-w-4xl">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Pengaturan Sistem</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Kelola parameter nama instansi pemerintah daerah dan pantau status runtime server.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instansi Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Pengaturan Instansi SKPD
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
                    Nama Lengkap Instansi (SKPD)
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
                    Kode Numerik Instansi (SKPD)
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

          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Database className="h-5 w-5 text-emerald-600" />
                Cadangan & Pemulihan Data (Backup & Recovery)
              </CardTitle>
              <CardDescription>
                Ekspor semua tabel data aplikasi ke format JSON atau pulihkan database dari cadangan yang ada.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {backupSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {backupError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}

              {isAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">
                  {/* Left: Export Section */}
                  <div className="space-y-4 pr-0 md:pr-6 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Download className="h-4 w-4 text-zinc-500" />
                        Ekspor Data (Backup)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Mengunduh salinan lengkap database dalam bentuk file JSON. Simpan file ini di tempat yang aman untuk mengantisipasi kehilangan data.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleExportBackup} 
                      disabled={isExporting || isImporting}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer w-full mt-2"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengekspor Data...
                        </>
                      ) : (
                        "Buat & Unduh Cadangan"
                      )}
                    </Button>
                  </div>

                  {/* Right: Import Section */}
                  <div className="space-y-4 pt-6 md:pt-0 pl-0 md:pl-6 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Upload className="h-4 w-4 text-zinc-500" />
                        Pulihkan Data (Restore)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Unggah file cadangan JSON yang telah diekspor sebelumnya untuk memulihkan seluruh status database.
                      </p>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept=".json"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          disabled={isExporting || isImporting}
                          className="hidden"
                          id="backup-file-upload"
                        />
                        <label
                          htmlFor="backup-file-upload"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-dashed rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                            uploadedFileName 
                              ? "border-emerald-500 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400" 
                              : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300",
                            (isExporting || isImporting) && "opacity-50 pointer-events-none"
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadedFileName ? uploadedFileName : "Pilih File Cadangan (.json)"}
                        </label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isExporting || isImporting || !uploadedJsonContent}
                      onClick={() => setShowRestoreConfirm(true)}
                      className="w-full cursor-pointer mt-2"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memulihkan Database...
                        </>
                      ) : (
                        "Mulai Pemulihan Data"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200/50 bg-amber-50/10 text-amber-600 dark:text-amber-500">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Akses Khusus Administrator</h4>
                    <p className="text-xs leading-relaxed mt-0.5">
                      Pengaturan cadangan dan pemulihan database hanya diizinkan untuk akun Administrator demi keamanan data instansi.
                    </p>
                  </div>
                </div>
              )}
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

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestoreConfirmed}
        title="Pulihkan Cadangan Data?"
        description="Peringatan: Seluruh data saat ini di database akan DIBERSIHKAN dan digantikan oleh data dari berkas cadangan ini. Proses ini tidak dapat dibatalkan."
        confirmLabel="Ya, Mulai Pemulihan"
        variant="danger"
      />

      {isImporting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-2xl text-center space-y-4 max-w-sm">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Memproses Pemulihan Data</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Database sedang diperbarui dari berkas cadangan. Jangan menutup halaman ini atau mematikan koneksi internet Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
