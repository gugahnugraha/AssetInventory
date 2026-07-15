"use client";

import * as React from "react";
import {
  FileText,
  Download,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";
import { formatRupiah } from "@/lib/utils";
import * as XLSX from "xlsx";

const KONDISI_LABELS: Record<string, string> = {
  NORMAL: "Normal", RUSAK_RINGAN: "Rusak Ringan", RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang", DALAM_PERBAIKAN: "Dalam Perbaikan", DIPINJAM: "Dipinjam",
};
const FINDING_TYPE_LABELS: Record<string, string> = {
  DATA_PEMEGANG: "Data Pemegang", DATA_DISTRIBUSI: "Data Distribusi", KONDISI: "Kondisi",
  LABEL: "Label", FOTO: "Foto", DOKUMEN: "Dokumen",
  ASET_TIDAK_DITEMUKAN: "Tidak Ditemukan", ASET_RUSAK: "Aset Rusak", ASET_HILANG: "Aset Hilang", LAINNYA: "Lainnya",
};

interface LaporanClientProps {
  periods: any[];
  initialReportData: any;
  userRole: Role;
  opdId: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SESUAI") return <Badge variant="success" className="text-[10px]">Sesuai</Badge>;
  if (status === "TIDAK_SESUAI") return <Badge variant="destructive" className="text-[10px]">Tidak Sesuai</Badge>;
  return <Badge variant="outline" className="text-[10px] text-zinc-500">Belum</Badge>;
}

export function LaporanClient({ periods, initialReportData, userRole, opdId }: LaporanClientProps) {
  const [report] = React.useState(initialReportData);

  if (!report || !report.period) {
    return (
      <div className="space-y-6 pt-2 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <FileText className="h-7 w-7 text-emerald-600" /> Laporan Rekonsiliasi
          </h1>
        </div>
        <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-900">Belum ada periode rekonsiliasi. Buat periode terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  const { period, stats, reconciliations, belumDirekonAssets, findingsByType, findingsBySeverity } = report;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const summaryData = [
      ["LAPORAN REKONSILIASI ASET"],
      ["Periode", period.nama],
      ["Triwulan", period.triwulan],
      ["Tahun", period.tahun],
      ["Tanggal Mulai", new Date(period.tanggalMulai).toLocaleDateString("id-ID")],
      ["Tanggal Selesai", new Date(period.tanggalSelesai).toLocaleDateString("id-ID")],
      [],
      ["Total Aset", stats.totalAssets],
      ["Direkonsiliasi", stats.totalRekon],
      ["Belum Direkonsiliasi", stats.belumDirekon],
      ["Sesuai", stats.sesuai],
      ["Tidak Sesuai", stats.tidakSesuai],
      ["Progress (%)", `${stats.progress}%`],
      ["Temuan Kritis", stats.criticalFindings],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Ringkasan");

    // Sheet 2: Aset Direkonsiliasi
    const reconRows = [
      ["No", "Kode Aset", "KIB", "Nama Aset", "Distribusi/Bidang", "Pemegang Barang", "Status Rekonsiliasi", "Pemeriksa", "Tanggal Periksa", "Jumlah Temuan", "Catatan"],
      ...reconciliations.map((r: any, i: number) => [
        i + 1,
        r.asset.kodeLengkap,
        r.asset.category?.kib ? `KIB ${r.asset.category.kib.kode} - ${r.asset.category.kib.nama}` : "-",
        r.asset.namaAset,
        r.asset.distribution?.nama || "-",
        r.asset.holder?.nama || "-",
        r.status === "SESUAI" ? "Sesuai" : r.status === "TIDAK_SESUAI" ? "Tidak Sesuai" : "Belum Direkon",
        r.checker?.nama || "-",
        r.checkedAt ? new Date(r.checkedAt).toLocaleDateString("id-ID") : "-",
        r.findings?.length || 0,
        r.notes || "-",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(reconRows), "Rekonsiliasi Aset");

    // Sheet 3: Belum Direkonsiliasi
    const belumRows = [
      ["No", "Kode Aset", "KIB", "Nama Aset", "Kategori", "Distribusi/Bidang", "Pemegang Barang", "Kondisi"],
      ...belumDirekonAssets.map((a: any, i: number) => [
        i + 1,
        a.kodeLengkap,
        a.category?.kib ? `KIB ${a.category.kib.kode} - ${a.category.kib.nama}` : "-",
        a.namaAset,
        a.category?.nama || "-",
        a.distribution?.nama || "-",
        a.holder?.nama || "-",
        KONDISI_LABELS[a.kondisi] || a.kondisi,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(belumRows), "Belum Direkonsiliasi");

    // Sheet 4: Temuan
    const allFindings = reconciliations.flatMap((r: any) =>
      (r.findings || []).map((f: any, i: number) => [
        r.asset.kodeLengkap,
        r.asset.namaAset,
        FINDING_TYPE_LABELS[f.findingType] || f.findingType,
        f.severity,
        f.description,
        f.recommendation,
        f.resolved ? "Selesai" : "Belum",
      ])
    );
    const findingRows = [["Kode Aset", "Nama Aset", "Jenis Temuan", "Keparahan", "Deskripsi", "Rekomendasi", "Status"], ...allFindings];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(findingRows), "Temuan");

    XLSX.writeFile(wb, `Laporan_Rekonsiliasi_${period.nama.replace(/\s+/g, "_")}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6 pt-0 pb-8 -mt-6">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2 flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full border border-emerald-100 dark:border-emerald-800 hidden sm:block">
              <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm flex items-center gap-2">
                Laporan Rekonsiliasi
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">{period.nama} — Triwulan {period.triwulan} Tahun {period.tahun}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
              <Download className="h-4 w-4" /> Ekspor Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Aset", value: stats.totalAssets, icon: BarChart3, bg: "bg-zinc-50", color: "text-zinc-700" },
          { label: "Direkonsiliasi", value: stats.totalRekon, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-700" },
          { label: "Belum Direkon", value: stats.belumDirekon, icon: Clock, bg: "bg-amber-50", color: "text-amber-700" },
          { label: "Tidak Sesuai", value: stats.tidakSesuai, icon: XCircle, bg: "bg-rose-50", color: "text-rose-700" },
        ].map((s) => (
          <Card key={s.label} className="border-zinc-200/80">
            <CardContent className={`p-4 ${s.bg} rounded-xl flex items-center justify-between`}>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-6 w-6 ${s.color} opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card className="border-zinc-200/80">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-zinc-700">Progress Rekonsiliasi</p>
            <span className="text-xl font-black text-emerald-700">{stats.progress}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-3">
            <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${stats.progress}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Aset Sesuai vs Tidak Sesuai */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sudah Direkonsiliasi */}
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Aset Direkonsiliasi ({reconciliations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {reconciliations.length === 0 ? (
              <p className="p-6 text-center text-zinc-400 text-sm">Belum ada.</p>
            ) : (
              <div className="divide-y">
                {reconciliations.slice(0, 50).map((r: any) => (
                  <div key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{r.asset.namaAset}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{r.asset.kodeLengkap}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={r.status} />
                      {r.findings?.length > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold">{r.findings.length}T</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Belum Direkonsiliasi */}
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Belum Direkonsiliasi ({belumDirekonAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {belumDirekonAssets.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-emerald-700 font-semibold">Semua aset telah direkonsiliasi!</p>
              </div>
            ) : (
              <div className="divide-y">
                {belumDirekonAssets.slice(0, 50).map((a: any) => (
                  <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{a.namaAset}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{a.kodeLengkap} · {a.distribution?.nama || "-"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-zinc-500 shrink-0">Belum</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Findings by Type */}
      {findingsByType.length > 0 && (
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Temuan Berdasarkan Jenis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {findingsByType.map((f: any) => (
                <div key={f.findingType} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border">
                  <span className="text-xs font-semibold text-zinc-700">{FINDING_TYPE_LABELS[f.findingType] || f.findingType}</span>
                  <Badge variant="destructive" className="text-xs">{f._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
