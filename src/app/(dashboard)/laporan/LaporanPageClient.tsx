"use client";

import * as React from "react";
import {
  FileBarChart2,
  LayoutDashboard,
  ListChecks,
  Activity,
  ArrowLeftRight,
  ClipboardCheck,
  ShieldAlert,
  Download,
  Printer,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  HandCoins,
  Minus,
  ChevronRight,
  FileText,
  ImageOff,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Role } from "@prisma/client";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Constants ───────────────────────────────────────────────────────────────

const KONDISI_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
  DALAM_PERBAIKAN: "Dalam Perbaikan",
  DIPINJAM: "Dipinjam",
  SUDAH_DIHAPUS: "Sudah Dihapus",
};

const KONDISI_COLORS: Record<string, string> = {
  NORMAL: "bg-emerald-500",
  RUSAK_RINGAN: "bg-amber-400",
  RUSAK_BERAT: "bg-orange-500",
  HILANG: "bg-rose-600",
  DALAM_PERBAIKAN: "bg-blue-400",
  DIPINJAM: "bg-purple-500",
  SUDAH_DIHAPUS: "bg-zinc-500",
};

const KONDISI_BADGE_VARIANTS: Record<string, string> = {
  NORMAL: "text-emerald-700 bg-emerald-50 border-emerald-200",
  RUSAK_RINGAN: "text-amber-700 bg-amber-50 border-amber-200",
  RUSAK_BERAT: "text-orange-700 bg-orange-50 border-orange-200",
  HILANG: "text-rose-700 bg-rose-50 border-rose-200",
  DALAM_PERBAIKAN: "text-blue-700 bg-blue-50 border-blue-200",
  DIPINJAM: "text-purple-700 bg-purple-50 border-purple-200",
  SUDAH_DIHAPUS: "text-zinc-700 bg-zinc-50 border-zinc-200",
};

const KONDISI_ICONS: Record<string, React.ReactNode> = {
  NORMAL: <CheckCircle2 className="h-4 w-4" />,
  RUSAK_RINGAN: <AlertTriangle className="h-4 w-4" />,
  RUSAK_BERAT: <XCircle className="h-4 w-4" />,
  HILANG: <Minus className="h-4 w-4" />,
  DALAM_PERBAIKAN: <Wrench className="h-4 w-4" />,
  DIPINJAM: <HandCoins className="h-4 w-4" />,
  SUDAH_DIHAPUS: <XCircle className="h-4 w-4" />,
};

const MUTASI_TYPE_LABELS: Record<string, string> = {
  HOLDER: "Pemegang",
  DISTRIBUTION: "Distribusi/Bidang",
  CONDITION: "Kondisi",
  MULTIPLE: "Gabungan",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tambah Aset",
  UPDATE: "Ubah Aset",
  DELETE: "Hapus Aset",
  CREATE_REKON_PERIOD: "Buat Periode Rekonsiliasi",
};

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaporanPageClientProps {
  summary: any;
  assets: any[];
  nilaiAset: any;
  mutasiHistories: any[];
  auditLogs: any[];
  assetsWithoutPhoto: any[];
  reconPeriods: any[];
  reconReportData: any;
  userRole: Role;
  opdName: string;
}

type TabId =
  | "ringkasan"
  | "daftar-aset"
  | "kondisi"
  | "nilai-aset"
  | "mutasi"
  | "rekonsiliasi"
  | "log-aktivitas";

// ─── Helper: format date ──────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KondisiBadge({ kondisi }: { kondisi: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
        KONDISI_BADGE_VARIANTS[kondisi] || "text-zinc-600 bg-zinc-50 border-zinc-200"
      }`}
    >
      {KONDISI_ICONS[kondisi]}
      {KONDISI_LABELS[kondisi] || kondisi}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
      {children}
    </h2>
  );
}

// ─── TAB: Ringkasan ──────────────────────────────────────────────────────────

function TabRingkasan({ summary, assets }: { summary: any; assets: any[] }) {
  const maxKondisi = Math.max(
    ...Object.values(summary.byKondisi as Record<string, { count: number }>).map(
      (v) => v.count
    ),
    1
  );
  const maxKib = Math.max(
    ...(summary.byKib as { count: number }[]).map((v) => v.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Aset",
            value: summary.totalAssets.toLocaleString("id-ID"),
            icon: Package,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
          },
          {
            label: "Total Nilai",
            value: formatRupiah(summary.totalValue),
            icon: TrendingUp,
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          {
            label: "Kondisi Normal",
            value: (summary.byKondisi["NORMAL"]?.count ?? 0).toLocaleString("id-ID"),
            icon: CheckCircle2,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
          },
          {
            label: "Aset Bermasalah",
            value: (
              (summary.byKondisi["RUSAK_RINGAN"]?.count ?? 0) +
              (summary.byKondisi["RUSAK_BERAT"]?.count ?? 0) +
              (summary.byKondisi["HILANG"]?.count ?? 0)
            ).toLocaleString("id-ID"),
            icon: AlertTriangle,
            color: "text-rose-700",
            bg: "bg-rose-50",
            border: "border-rose-200",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`border ${card.border} shadow-sm`}>
              <CardContent className={`p-4 ${card.bg} rounded-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className={`text-xl font-black mt-1 ${card.color} leading-tight`}>
                      {card.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${card.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Breakdown by Kondisi */}
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Rekap Per Kondisi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {Object.entries(summary.byKondisi as Record<string, { count: number; value: number }>)
              .filter(([, v]) => v.count > 0 || true)
              .map(([kondisi, data]) => (
                <div key={kondisi}>
                  <div className="flex items-center justify-between mb-1">
                    <KondisiBadge kondisi={kondisi} />
                    <span className="text-xs font-bold text-zinc-700">{data.count} aset</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${KONDISI_COLORS[kondisi] || "bg-zinc-400"}`}
                      style={{ width: `${(data.count / maxKondisi) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Breakdown by KIB */}
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Rekap Per KIB
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {(summary.byKib as { kode: string; nama: string; count: number; value: number }[]).map(
              (kib) => (
                <div key={kib.kode}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-700">
                      <span className="font-black text-emerald-700 mr-1">KIB {kib.kode}</span>
                      {kib.nama}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-700">{kib.count} aset</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(kib.count / maxKib) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {formatRupiah(kib.value)}
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── TAB: Daftar Aset ─────────────────────────────────────────────────────────

function TabDaftarAset({ assets }: { assets: any[] }) {
  const [kibFilter, setKibFilter] = React.useState("");
  const [kondisiFilter, setKondisiFilter] = React.useState("");
  const [distribusiFilter, setDistribusiFilter] = React.useState("");
  const [search, setSearch] = React.useState("");

  const kibs = React.useMemo(() => {
    const set = new Map<string, string>();
    for (const a of assets) {
      const kib = a.category?.kib;
      if (kib) set.set(kib.kode, `KIB ${kib.kode} — ${kib.nama}`);
    }
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assets]);

  const distribusionList = React.useMemo(() => {
    const set = new Map<string, string>();
    for (const a of assets) {
      const d = a.distribution;
      if (d) set.set(d.nama, d.nama);
    }
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assets]);

  const filtered = React.useMemo(() => {
    return assets.filter((a) => {
      if (kibFilter && a.category?.kib?.kode !== kibFilter) return false;
      if (kondisiFilter && a.kondisi !== kondisiFilter) return false;
      if (distribusiFilter && a.distribution?.nama !== distribusiFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.namaAset?.toLowerCase().includes(q) ||
          a.kodeLengkap?.toLowerCase().includes(q) ||
          a.merkType?.toLowerCase().includes(q) ||
          a.holder?.nama?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, kibFilter, kondisiFilter, distribusiFilter, search]);

  const exportExcel = () => {
    const rows = [
      ["No", "Kode Aset", "KIB", "Kategori", "Nama Aset", "Merk/Type", "Distribusi/Bidang", "Pemegang Barang", "NIP Pemegang", "Kondisi", "Harga (Rp)", "Tahun Pembelian"],
      ...filtered.map((a, i) => [
        i + 1,
        a.kodeLengkap,
        a.category?.kib ? `KIB ${a.category.kib.kode}` : "-",
        a.category?.nama || "-",
        a.namaAset,
        a.merkType || "-",
        a.distribution?.nama || "-",
        a.holder?.nama || "-",
        a.holder?.nip || "-",
        KONDISI_LABELS[a.kondisi] || a.kondisi,
        a.harga || 0,
        a.tahunPembelian || "-",
      ]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Daftar Aset");
    XLSX.writeFile(wb, `Laporan_Daftar_Aset_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Cari nama, kode, merk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={kibFilter}
          onChange={(e) => setKibFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua KIB</option>
          {kibs.map(([kode, label]) => (
            <option key={kode} value={kode}>{label}</option>
          ))}
        </select>
        <select
          value={kondisiFilter}
          onChange={(e) => setKondisiFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua Kondisi</option>
          {Object.entries(KONDISI_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={distribusiFilter}
          onChange={(e) => setDistribusiFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua Distribusi</option>
          {distribusionList.map(([nama]) => (
            <option key={nama} value={nama}>{nama}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-auto font-semibold">
          {filtered.length} dari {assets.length} aset
        </span>
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Excel
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                {["No", "Kode Aset", "KIB", "Nama Aset", "Merk/Type", "Distribusi", "Pemegang", "Kondisi", "Harga", "Tahun"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left font-bold text-zinc-600 whitespace-nowrap border-b border-zinc-200"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-3 py-2 text-zinc-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-800">{a.kodeLengkap}</td>
                    <td className="px-3 py-2">
                      {a.category?.kib ? (
                        <span className="font-bold text-emerald-700">KIB {a.category.kib.kode}</span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-zinc-900 min-w-[160px]">{a.namaAset}</td>
                    <td className="px-3 py-2 text-zinc-600">{a.merkType || "-"}</td>
                    <td className="px-3 py-2 text-zinc-600">{a.distribution?.nama || "-"}</td>
                    <td className="px-3 py-2 text-zinc-600">{a.holder?.nama || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-3 py-2">
                      <KondisiBadge kondisi={a.kondisi} />
                    </td>
                    <td className="px-3 py-2 text-zinc-700 font-semibold whitespace-nowrap">
                      {formatRupiah(a.harga || 0)}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{a.tahunPembelian || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Rekap Kondisi ───────────────────────────────────────────────────────

function TabRekapKondisi({ assets }: { assets: any[] }) {
  const byKondisi = React.useMemo(() => {
    const map: Record<string, { count: number; value: number; items: any[] }> = {};
    for (const k of Object.keys(KONDISI_LABELS)) {
      map[k] = { count: 0, value: 0, items: [] };
    }
    for (const a of assets) {
      if (map[a.kondisi]) {
        map[a.kondisi].count++;
        map[a.kondisi].value += a.harga || 0;
        map[a.kondisi].items.push(a);
      }
    }
    return map;
  }, [assets]);

  const [expanded, setExpanded] = React.useState<string | null>(null);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    // Rekap sheet
    const rekapRows = [
      ["Kondisi", "Jumlah Aset", "Total Nilai (Rp)", "Persentase"],
      ...Object.entries(byKondisi).map(([k, v]) => [
        KONDISI_LABELS[k] || k,
        v.count,
        v.value,
        assets.length > 0 ? `${((v.count / assets.length) * 100).toFixed(1)}%` : "0%",
      ]),
      [],
      ["Total", assets.length, assets.reduce((s, a) => s + (a.harga || 0), 0), "100%"],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rekapRows), "Rekap Kondisi");

    // Detail per kondisi
    for (const [k, v] of Object.entries(byKondisi)) {
      if (v.items.length === 0) continue;
      const rows = [
        ["No", "Kode Aset", "Nama Aset", "Merk/Type", "Distribusi", "Pemegang", "Harga"],
        ...v.items.map((a: any, i: number) => [
          i + 1, a.kodeLengkap, a.namaAset, a.merkType || "-",
          a.distribution?.nama || "-", a.holder?.nama || "-", a.harga || 0,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), KONDISI_LABELS[k].substring(0, 31));
    }
    XLSX.writeFile(wb, `Laporan_Kondisi_Aset_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Ekspor Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(byKondisi).map(([kondisi, data]) => (
          <Card
            key={kondisi}
            className={`border-2 cursor-pointer transition-all ${
              expanded === kondisi ? "border-emerald-400 shadow-md" : "border-zinc-200 hover:border-zinc-300"
            }`}
            onClick={() => setExpanded(expanded === kondisi ? null : kondisi)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <KondisiBadge kondisi={kondisi} />
                <ChevronRight
                  className={`h-4 w-4 text-zinc-400 transition-transform ${
                    expanded === kondisi ? "rotate-90" : ""
                  }`}
                />
              </div>
              <p className="text-2xl font-black text-zinc-900">{data.count}</p>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">aset</p>
              <p className="text-xs text-zinc-500 mt-1">{formatRupiah(data.value)}</p>
              {assets.length > 0 && (
                <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${KONDISI_COLORS[kondisi]}`}
                    style={{ width: `${(data.count / assets.length) * 100}%` }}
                  />
                </div>
              )}
              <p className="text-[10px] text-zinc-400 mt-1">
                {assets.length > 0 ? `${((data.count / assets.length) * 100).toFixed(1)}%` : "0%"} dari total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail panel */}
      {expanded && byKondisi[expanded].items.length > 0 && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
              <KondisiBadge kondisi={expanded} />
              <span>— Daftar Aset ({byKondisi[expanded].items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr>
                    {["Kode Aset", "Nama Aset", "Distribusi", "Pemegang", "Harga"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-zinc-500 border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {byKondisi[expanded].items.map((a: any) => (
                    <tr key={a.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-2 font-mono font-semibold text-zinc-800">{a.kodeLengkap}</td>
                      <td className="px-3 py-2 font-semibold text-zinc-900">{a.namaAset}</td>
                      <td className="px-3 py-2 text-zinc-600">{a.distribution?.nama || "-"}</td>
                      <td className="px-3 py-2 text-zinc-600">{a.holder?.nama || "-"}</td>
                      <td className="px-3 py-2 text-zinc-700 font-semibold">{formatRupiah(a.harga || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── TAB: Nilai Aset ──────────────────────────────────────────────────────────

function TabNilaiAset({ nilaiAset }: { nilaiAset: any }) {
  const maxKib = Math.max(...nilaiAset.perKib.map((k: any) => k.value), 1);
  const maxDist = Math.max(...nilaiAset.perDistribusi.map((d: any) => d.value), 1);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const kibRows = [
      ["KIB", "Nama KIB", "Jumlah Aset", "Total Nilai (Rp)"],
      ...nilaiAset.perKib.map((k: any) => [`KIB ${k.kode}`, k.nama, k.count, k.value]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kibRows), "Nilai per KIB");

    const distRows = [
      ["Distribusi/Bidang", "Jumlah Aset", "Total Nilai (Rp)"],
      ...nilaiAset.perDistribusi.map((d: any) => [d.nama, d.count, d.value]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(distRows), "Nilai per Distribusi");

    const tahunRows = [
      ["Tahun Pembelian", "Jumlah Aset", "Total Nilai (Rp)"],
      ...nilaiAset.perTahun.map((t: any) => [t.tahun, t.count, t.value]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tahunRows), "Nilai per Tahun");

    XLSX.writeFile(wb, `Laporan_Nilai_Aset_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-semibold">Total Nilai Aset Keseluruhan</p>
          <p className="text-3xl font-black text-emerald-700 mt-0.5">
            {formatRupiah(nilaiAset.totalValue)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{nilaiAset.totalCount} aset terdaftar</p>
        </div>
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Ekspor Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Per KIB */}
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Nilai Per KIB
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {nilaiAset.perKib.map((kib: any) => (
              <div key={kib.kode}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-xs font-black text-emerald-700">KIB {kib.kode}</span>
                    <span className="text-xs text-zinc-600 ml-1">{kib.nama}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-800">{formatRupiah(kib.value)}</p>
                    <p className="text-[10px] text-zinc-400">{kib.count} aset</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(kib.value / maxKib) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {nilaiAset.perKib.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-4">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Per Distribusi */}
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Nilai Per Distribusi / Bidang
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {nilaiAset.perDistribusi.map((d: any) => (
              <div key={d.nama}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-zinc-700">{d.nama}</span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-800">{formatRupiah(d.value)}</p>
                    <p className="text-[10px] text-zinc-400">{d.count} aset</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(d.value / maxDist) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {nilaiAset.perDistribusi.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-4">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per Tahun */}
      {nilaiAset.perTahun.length > 0 && (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Rincian Per Tahun Pengadaan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    {["Tahun", "Jumlah Aset", "Total Nilai"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-zinc-500 border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {nilaiAset.perTahun.map((t: any) => (
                    <tr key={t.tahun} className="hover:bg-zinc-50">
                      <td className="px-4 py-2 font-bold text-zinc-800">{t.tahun}</td>
                      <td className="px-4 py-2 text-zinc-600">{t.count} aset</td>
                      <td className="px-4 py-2 font-semibold text-zinc-800">{formatRupiah(t.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── TAB: Mutasi Aset ─────────────────────────────────────────────────────────

function TabMutasiAset({ mutasiHistories }: { mutasiHistories: any[] }) {
  const [typeFilter, setTypeFilter] = React.useState("");

  const filtered = React.useMemo(() => {
    return mutasiHistories.filter((h) => {
      if (typeFilter && h.mutationType !== typeFilter) return false;
      return true;
    });
  }, [mutasiHistories, typeFilter]);

  const exportExcel = () => {
    const rows = [
      ["No", "Kode Aset", "Nama Aset", "Jenis Mutasi", "Dari Distribusi", "Ke Distribusi", "Dari Pemegang", "Ke Pemegang", "Dari Kondisi", "Ke Kondisi", "No. BA", "Tanggal BA", "Dibuat Oleh"],
      ...filtered.map((h, i) => [
        i + 1,
        h.asset?.kodeLengkap || "-",
        h.asset?.namaAset || "-",
        MUTASI_TYPE_LABELS[h.mutationType] || h.mutationType,
        h.fromDistribution?.nama || "-",
        h.toDistribution?.nama || "-",
        h.fromHolder?.nama || "-",
        h.toHolder?.nama || "-",
        KONDISI_LABELS[h.fromCondition] || h.fromCondition || "-",
        KONDISI_LABELS[h.toCondition] || h.toCondition || "-",
        h.beritaAcaraNumber || "-",
        h.beritaAcaraDate ? new Date(h.beritaAcaraDate).toLocaleDateString("id-ID") : "-",
        h.creator?.nama || "-",
      ]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Mutasi Aset");
    XLSX.writeFile(wb, `Laporan_Mutasi_Aset_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua Jenis Mutasi</option>
          {Object.entries(MUTASI_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-auto font-semibold">
          {filtered.length} dari {mutasiHistories.length} record
        </span>
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Ekspor Excel
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                {["No", "Kode Aset", "Nama Aset", "Jenis Mutasi", "Perubahan", "No. BA", "Tgl. BA", "Oleh"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold text-zinc-600 whitespace-nowrap border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                    Belum ada riwayat mutasi.
                  </td>
                </tr>
              ) : (
                filtered.map((h, i) => (
                  <tr key={h.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 text-zinc-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-800">
                      {h.asset?.kodeLengkap || "-"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-zinc-900 min-w-[140px]">
                      {h.asset?.namaAset || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                        {MUTASI_TYPE_LABELS[h.mutationType] || h.mutationType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600 min-w-[180px]">
                      {h.mutationType === "HOLDER" && (
                        <span>{h.fromHolder?.nama || "—"} → {h.toHolder?.nama || "—"}</span>
                      )}
                      {h.mutationType === "DISTRIBUTION" && (
                        <span>{h.fromDistribution?.nama || "—"} → {h.toDistribution?.nama || "—"}</span>
                      )}
                      {h.mutationType === "CONDITION" && (
                        <span>
                          <KondisiBadge kondisi={h.fromCondition} /> → <KondisiBadge kondisi={h.toCondition} />
                        </span>
                      )}
                      {h.mutationType === "MULTIPLE" && (
                        <span className="text-zinc-400">Beberapa perubahan</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-zinc-600">{h.beritaAcaraNumber}</td>
                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(h.beritaAcaraDate)}</td>
                    <td className="px-3 py-2 text-zinc-600">{h.creator?.nama || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Rekonsiliasi ────────────────────────────────────────────────────────

function TabRekonsiliasi({
  reconPeriods,
  reconReportData,
}: {
  reconPeriods: any[];
  reconReportData: any;
}) {
  if (!reconReportData || !reconReportData.period) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm font-bold text-amber-900">
          Belum ada periode rekonsiliasi. Buat periode terlebih dahulu di menu Rekonsiliasi.
        </p>
      </div>
    );
  }

  const { period, stats, reconciliations, belumDirekonAssets, findingsByType } = reconReportData;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ["LAPORAN REKONSILIASI ASET"],
      ["Periode", period.nama],
      ["Triwulan", `Triwulan ${period.triwulan}`],
      ["Tahun", period.tahun],
      [],
      ["Total Aset", stats.totalAssets],
      ["Direkonsiliasi", stats.totalRekon],
      ["Belum Direkon", stats.belumDirekon],
      ["Sesuai", stats.sesuai],
      ["Tidak Sesuai", stats.tidakSesuai],
      ["Progress", `${stats.progress}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Ringkasan");

    const detailRows = [
      ["No", "Kode Aset", "Nama Aset", "KIB", "Distribusi", "Pemegang", "Status", "Pemeriksa", "Jumlah Temuan"],
      ...reconciliations.map((r: any, i: number) => [
        i + 1, r.asset.kodeLengkap, r.asset.namaAset,
        r.asset.category?.kib ? `KIB ${r.asset.category.kib.kode}` : "-",
        r.asset.distribution?.nama || "-", r.asset.holder?.nama || "-",
        r.status === "SESUAI" ? "Sesuai" : r.status === "TIDAK_SESUAI" ? "Tidak Sesuai" : "Belum",
        r.checker?.nama || "-", r.findings?.length || 0,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), "Detail Rekonsiliasi");
    XLSX.writeFile(wb, `Laporan_Rekonsiliasi_${period.nama.replace(/\s+/g, "_")}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-zinc-500 font-semibold">Periode Aktif</p>
          <p className="text-lg font-black text-zinc-900">{period.nama}</p>
          <p className="text-xs text-zinc-500">
            Triwulan {period.triwulan} · Tahun {period.tahun}
          </p>
        </div>
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Ekspor Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Aset", value: stats.totalAssets, icon: BarChart3, color: "text-zinc-700", bg: "bg-zinc-50" },
          { label: "Direkonsiliasi", value: stats.totalRekon, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Belum Direkon", value: stats.belumDirekon, icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Tidak Sesuai", value: stats.tidakSesuai, icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-zinc-200">
              <CardContent className={`p-4 ${s.bg} rounded-xl flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <Icon className={`h-6 w-6 ${s.color} opacity-60`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress bar */}
      <Card className="border-zinc-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-zinc-700">Progress Rekonsiliasi</p>
            <span className="text-xl font-black text-emerald-700">{stats.progress}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Findings by type */}
      {findingsByType.length > 0 && (
        <Card className="border-zinc-200">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Temuan Berdasarkan Jenis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {findingsByType.map((f: any) => (
                <div key={f.findingType} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border">
                  <span className="text-xs font-semibold text-zinc-700">
                    {FINDING_TYPE_LABELS[f.findingType] || f.findingType}
                  </span>
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

// ─── TAB: Log Aktivitas ───────────────────────────────────────────────────────

function TabLogAktivitas({ auditLogs, userRole }: { auditLogs: any[]; userRole: Role }) {
  if (userRole !== Role.ADMINISTRATOR && userRole !== Role.MANAGER) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-xl bg-rose-50 border border-rose-200">
        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
        <p className="text-sm font-bold text-rose-900">
          Akses ditolak. Log Aktivitas hanya tersedia untuk Administrator dan Manager.
        </p>
      </div>
    );
  }

  const exportExcel = () => {
    const rows = [
      ["No", "Waktu", "Pengguna", "Role", "Aksi", "Kode Aset", "Nama Aset"],
      ...auditLogs.map((l, i) => [
        i + 1,
        new Date(l.createdAt).toLocaleString("id-ID"),
        l.user?.nama || "-",
        l.user?.role || "-",
        ACTION_LABELS[l.action] || l.action,
        l.asset?.kodeLengkap || "-",
        l.asset?.namaAset || "-",
      ]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Log Aktivitas");
    XLSX.writeFile(wb, `Laporan_Log_Aktivitas_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500 font-semibold">{auditLogs.length} entri terakhir</p>
        <Button
          size="sm"
          onClick={exportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Ekspor Excel
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                {["Waktu", "Pengguna", "Aksi", "Aset"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold text-zinc-600 whitespace-nowrap border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                    Belum ada log aktivitas.
                  </td>
                </tr>
              ) : (
                auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-zinc-800">{l.user?.nama || "-"}</p>
                      <p className="text-[10px] text-zinc-400">{l.user?.role}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          l.action === "CREATE" || l.action === "CREATE_REKON_PERIOD"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : l.action === "DELETE"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {l.asset ? (
                        <div>
                          <p className="font-semibold text-zinc-800">{l.asset.namaAset}</p>
                          <p className="text-[10px] font-mono text-zinc-400">{l.asset.kodeLengkap}</p>
                        </div>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CLIENT COMPONENT ────────────────────────────────────────────────────

export function LaporanPageClient({
  summary,
  assets,
  nilaiAset,
  mutasiHistories,
  auditLogs,
  assetsWithoutPhoto,
  reconPeriods,
  reconReportData,
  userRole,
  opdName,
}: LaporanPageClientProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("ringkasan");

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "ringkasan", label: "Ringkasan", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "daftar-aset", label: "Daftar Aset", icon: <ListChecks className="h-4 w-4" />, badge: assets.length },
    { id: "kondisi", label: "Rekap Kondisi", icon: <Activity className="h-4 w-4" /> },
    { id: "nilai-aset", label: "Nilai Aset", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "mutasi", label: "Mutasi Aset", icon: <ArrowLeftRight className="h-4 w-4" />, badge: mutasiHistories.length },
    { id: "rekonsiliasi", label: "Rekonsiliasi", icon: <ClipboardCheck className="h-4 w-4" /> },
    ...(userRole === Role.ADMINISTRATOR || userRole === Role.MANAGER
      ? [{ id: "log-aktivitas" as TabId, label: "Log Aktivitas", icon: <ShieldAlert className="h-4 w-4" />, badge: auditLogs.length }]
      : []),
  ];

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 pb-8 pt-0">
      {/* Page Header */}
      <div className="bg-white border border-zinc-200 px-4 sm:px-6 py-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-full border border-emerald-100 hidden sm:block">
              <FileBarChart2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                Laporan Aset
              </h1>
              <p className="text-sm text-zinc-500 font-medium mt-0.5">
                {opdName || "OPD"} · Data per {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 cursor-pointer border-zinc-300 hover:border-zinc-400"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-max min-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="print:block">
        {/* Print header (only shows when printing) */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-black">Laporan Aset — {tabs.find((t) => t.id === activeTab)?.label}</h1>
          <p className="text-sm text-zinc-600">{opdName} · {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
          <hr className="mt-3" />
        </div>

        {activeTab === "ringkasan" && <TabRingkasan summary={summary} assets={assets} />}
        {activeTab === "daftar-aset" && <TabDaftarAset assets={assets} />}
        {activeTab === "kondisi" && <TabRekapKondisi assets={assets} />}
        {activeTab === "nilai-aset" && <TabNilaiAset nilaiAset={nilaiAset} />}
        {activeTab === "mutasi" && <TabMutasiAset mutasiHistories={mutasiHistories} />}
        {activeTab === "rekonsiliasi" && (
          <TabRekonsiliasi reconPeriods={reconPeriods} reconReportData={reconReportData} />
        )}
        {activeTab === "log-aktivitas" && (
          <TabLogAktivitas auditLogs={auditLogs} userRole={userRole} />
        )}
      </div>
    </div>
  );
}
