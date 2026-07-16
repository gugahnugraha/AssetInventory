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
  ShieldAlert,
  Cpu,
  Activity,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOpdAction, getServerDiagnosticsAction } from "@/actions/opd";
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

  const [diagnostics, setDiagnostics] = React.useState<any | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = React.useState(false);

  const handleRunDiagnostics = React.useCallback(async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await getServerDiagnosticsAction();
      if (res.success && res.data) {
        setDiagnostics(res.data);
      } else {
        console.error("Diagnostics failed", res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, []);

  React.useEffect(() => {
    handleRunDiagnostics();
  }, [handleRunDiagnostics]);

  const formatUptime = (secondsStr: string) => {
    const seconds = parseInt(secondsStr, 10);
    if (isNaN(seconds)) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} jam ${m} menit`;
    if (m > 0) return `${m} menit ${s} detik`;
    return `${s} detik`;
  };

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

  const getMemoryStatus = () => {
    if (!diagnostics) return "unknown";
    const match = diagnostics.system.memoryHeap.match(/(\d+)MB\s*\/\s*(\d+)MB/);
    if (match) {
      const used = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      const pct = used / total;
      if (pct >= 0.90) return "critical";
      if (pct >= 0.75) return "warning";
      return "healthy";
    }
    return "healthy";
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
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
                <div className="relative shrink-0">
                  <HardDrive className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Penyimpanan Media</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {isR2Configured ? "Penyimpanan Objek Terdistribusi (Aktif)" : "Penyimpanan Berkas Lokal (Aktif)"}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    {isR2Configured 
                      ? "Penyimpanan awan terdistribusi aktif untuk dokumentasi foto aset." 
                      : "Penyimpanan lokal di folder server aktif (mode pengembangan)."}
                  </p>
                </div>
              </div>

              {/* Database */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
                <div className="relative shrink-0">
                  <Database className="h-5 w-5 text-emerald-600 mt-0.5" />
                  {diagnostics ? (
                    (() => {
                      const lat = parseInt(diagnostics.database.latency, 10);
                      if (isNaN(lat)) {
                        return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />;
                      }
                      if (lat >= 150) {
                        return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />;
                      }
                      return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />;
                    })()
                  ) : (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-zinc-450 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Koneksi Database</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none flex items-center gap-1.5">
                    {diagnostics ? (
                      <>
                        Online
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-900/50 font-medium">
                          {diagnostics.database.latency}
                        </span>
                      </>
                    ) : (
                      "Menghubungkan..."
                    )}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    {diagnostics 
                      ? `${diagnostics.database.driver} · ${diagnostics.database.assetCount} aset · ${diagnostics.database.userCount} pengguna`
                      : "Mendapatkan statistik mesin database dengan Prisma adapter..."}
                  </p>
                </div>
              </div>

              {/* Runtime Specs */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
                <div className="relative shrink-0">
                  <Cpu className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Sistem & Runtime</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none flex items-center gap-1.5">
                    {diagnostics ? (
                      <>
                        Node.js {diagnostics.system.nodeVersion}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-medium uppercase">
                          {diagnostics.system.envMode}
                        </span>
                      </>
                    ) : (
                      "Memuat..."
                    )}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    {diagnostics 
                      ? `Platform: ${diagnostics.system.platform} · Memori RSS: ${diagnostics.system.memoryRss}`
                      : "Membaca spesifikasi OS, arsitektur, dan alokasi heap..."}
                  </p>
                </div>
              </div>

              {/* Memory Heap */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
                <div className="relative shrink-0">
                  <Activity className="h-5 w-5 text-emerald-600 mt-0.5" />
                  {diagnostics ? (
                    (() => {
                      const status = getMemoryStatus();
                      if (status === "critical") {
                        return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />;
                      }
                      if (status === "warning") {
                        return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />;
                      }
                      return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />;
                    })()
                  ) : (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-zinc-450 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Alokasi Memori Heap</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {diagnostics ? diagnostics.system.memoryHeap : "Mengukur..."}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal font-sans">
                    {diagnostics 
                      ? "Porsi memori v8 heap yang digunakan dari total alokasi runtime."
                      : "Mengambil data penggunaan ram node process..."}
                  </p>
                </div>
              </div>

              {/* Uptime */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
                <div className="relative shrink-0">
                  <Clock className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-400">Uptime Server</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {diagnostics ? formatUptime(diagnostics.system.uptime) : "Menghitung..."}
                  </p>
                  <p className="text-[9px] text-zinc-400 lowercase font-medium tracking-normal mt-1 leading-normal">
                    Durasi aktif runtime aplikasi sejak proses dihidupkan.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiagnostics}
                  variant="outline"
                  className="w-full text-xs font-bold gap-2 cursor-pointer flex items-center justify-center h-9"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRunningDiagnostics && "animate-spin")} />
                  {isRunningDiagnostics ? "Memeriksa..." : "Segarkan Diagnostik"}
                </Button>
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
