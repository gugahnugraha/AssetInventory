"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Search, Filter, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import { resolveFindingAction } from "@/actions/reconciliation";

const FINDING_TYPE_LABELS: Record<string, string> = {
  DATA_PEMEGANG: "Data Pemegang",
  DATA_DISTRIBUSI: "Data Distribusi",
  KONDISI: "Kondisi",
  LABEL: "Label",
  FOTO: "Foto",
  DOKUMEN: "Dokumen",
  ASET_TIDAK_DITEMUKAN: "Tidak Ditemukan",
  ASET_RUSAK: "Aset Rusak",
  ASET_HILANG: "Aset Hilang",
  LAINNYA: "Lainnya",
};

const SEVERITY_CONFIG: Record<string, { cls: string; label: string }> = {
  CRITICAL: { cls: "bg-rose-100 text-rose-800 border-rose-200", label: "Kritis" },
  HIGH: { cls: "bg-orange-100 text-orange-800 border-orange-200", label: "Tinggi" },
  MEDIUM: { cls: "bg-amber-100 text-amber-800 border-amber-200", label: "Sedang" },
  LOW: { cls: "bg-blue-100 text-blue-800 border-blue-200", label: "Rendah" },
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  MUTASI_ASET: "Mutasi Aset",
  PERBAIKAN_DATA: "Perbaikan Data",
  PENGHAPUSAN_ASET: "Penghapusan Aset",
  UPLOAD_DOKUMEN: "Upload Dokumen",
  PENGADAAN_LABEL: "Pengadaan Label",
  TIDAK_ADA: "Tidak Ada",
};

interface TemuanClientProps {
  findings: any[];
  periods: any[];
  userRole: Role;
}

export function TemuanClient({ findings, periods, userRole }: TemuanClientProps) {
  const [search, setSearch] = React.useState("");
  const [filterSeverity, setFilterSeverity] = React.useState("ALL");
  const [filterType, setFilterType] = React.useState("ALL");
  const [filterResolved, setFilterResolved] = React.useState("UNRESOLVED");
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  const canEdit = userRole !== Role.MANAGER;

  const filtered = findings.filter((f) => {
    const assetName = f.reconciliation?.asset?.namaAset?.toLowerCase() || "";
    const assetCode = f.reconciliation?.asset?.kodeLengkap?.toLowerCase() || "";
    const matchSearch = assetName.includes(search.toLowerCase()) || assetCode.includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "ALL" || f.severity === filterSeverity;
    const matchType = filterType === "ALL" || f.findingType === filterType;
    const matchResolved =
      filterResolved === "ALL" ||
      (filterResolved === "RESOLVED" && f.resolved) ||
      (filterResolved === "UNRESOLVED" && !f.resolved);
    return matchSearch && matchSeverity && matchType && matchResolved;
  });

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    await resolveFindingAction(id);
    setResolvingId(null);
    window.location.reload();
  };

  const stats = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === "CRITICAL" && !f.resolved).length,
    unresolved: findings.filter((f) => !f.resolved).length,
    resolved: findings.filter((f) => f.resolved).length,
  };

  return (
    <div className="space-y-6 pt-0 pb-8 -mt-6">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2 flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full border border-emerald-100 dark:border-emerald-800 hidden sm:block">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm flex items-center gap-2">
                Temuan Rekonsiliasi
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                Daftar seluruh temuan dari proses pemeriksaan aset.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Temuan", value: stats.total, color: "text-zinc-700", bg: "bg-zinc-50" },
          { label: "Belum Selesai", value: stats.unresolved, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Kritis", value: stats.critical, color: "text-rose-700", bg: "bg-rose-50" },
          { label: "Selesai", value: stats.resolved, color: "text-emerald-700", bg: "bg-emerald-50" },
        ].map((s) => (
          <Card key={s.label} className="border-zinc-200/80">
            <CardContent className={`p-4 ${s.bg} rounded-xl`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-zinc-200/80">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input placeholder="Cari aset atau deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="ALL">Semua Keparahan</option>
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="ALL">Semua Jenis</option>
                {Object.entries(FINDING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select value={filterResolved} onChange={(e) => setFilterResolved(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="ALL">Semua Status</option>
                <option value="UNRESOLVED">Belum Selesai</option>
                <option value="RESOLVED">Selesai</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <Card className="border-zinc-200/80 overflow-hidden">
        <CardHeader className="border-b bg-zinc-50 py-3 px-4">
          <CardTitle className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
            {filtered.length} temuan ditampilkan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm">
              <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
              Tidak ada temuan yang sesuai filter.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((f) => {
                const sev = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.LOW;
                return (
                  <div key={f.id} className={`px-4 py-4 ${f.resolved ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.cls}`}>{sev.label}</span>
                          <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">{FINDING_TYPE_LABELS[f.findingType] || f.findingType}</span>
                          {f.resolved && <Badge variant="success" className="text-[10px]">Selesai</Badge>}
                        </div>
                        <p className="text-sm font-semibold text-zinc-800 mb-1">{f.description}</p>
                        <div className="text-xs text-zinc-500 flex flex-wrap gap-3">
                          <span className="font-mono">{f.reconciliation?.asset?.kodeLengkap}</span>
                          <span>·</span>
                          <span>{f.reconciliation?.asset?.namaAset}</span>
                          {f.reconciliation?.period && <><span>·</span><span>{f.reconciliation.period.nama}</span></>}
                          <span>·</span>
                          <span>Rekomendasi: <span className="font-semibold">{RECOMMENDATION_LABELS[f.recommendation] || f.recommendation}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/rekonsiliasi/pemeriksaan/${f.assetReconciliationId}`}>
                          <Button variant="outline" size="sm" className="text-xs cursor-pointer gap-1">
                            <Eye className="h-3 w-3" /> Buka
                          </Button>
                        </Link>
                        {canEdit && !f.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            disabled={resolvingId === f.id}
                            onClick={() => handleResolve(f.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {resolvingId === f.id ? "..." : "Selesai"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
