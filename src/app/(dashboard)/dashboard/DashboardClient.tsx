"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Boxes, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  XCircle,
  Wrench,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  ListTodo,
  History as HistoryIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Kondisi } from "@prisma/client";

interface DashboardClientProps {
  stats: {
    metrics: {
      total: number;
      normal: number;
      rusakRingan: number;
      rusakBerat: number;
      hilang: number;
      perbaikan: number;
      dipinjam: number;
      totalValue: number;
    };
    charts: {
      byDistribution: { name: string; total: number }[];
      byType: { name: string; total: number }[];
      byKib: { name: string; kode: string; value: number }[];
      byTahun: { name: string; total: number }[];
    };
    latestAssets: any[];
  };
  recentLogs: any[];
  recentMutations: any[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const KIB_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444"];

export function DashboardClient({ stats, recentLogs, recentMutations }: DashboardClientProps) {
  const { metrics, charts, latestAssets } = stats;
  const kibChartData = charts.byKib || [];
  
  // Tab State
  const [activeTab, setActiveTab] = React.useState("ringkasan");

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const kondisiChartData = [
    { name: "Baik", total: metrics.normal, fill: "#10b981" },
    { name: "Rusak Ringan", total: metrics.rusakRingan, fill: "#f59e0b" },
    { name: "Rusak Berat", total: metrics.rusakBerat, fill: "#ef4444" },
    { name: "Dalam Perbaikan", total: metrics.perbaikan, fill: "#3b82f6" },
    { name: "Dipinjam", total: metrics.dipinjam, fill: "#8b5cf6" },
    { name: "Hilang", total: metrics.hilang, fill: "#ec4899" },
  ];

  const getKondisiLabel = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL: return "Normal";
      case Kondisi.RUSAK_RINGAN: return "Rusak Ringan";
      case Kondisi.RUSAK_BERAT: return "Rusak Berat";
      case Kondisi.HILANG: return "Hilang";
      case Kondisi.DALAM_PERBAIKAN: return "Dalam Perbaikan";
      case Kondisi.DIPINJAM: return "Dipinjam";
      default: return kondisi;
    }
  };

  const getKondisiBadgeVariant = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL: return "success";
      case Kondisi.RUSAK_RINGAN:
      case Kondisi.DALAM_PERBAIKAN:
      case Kondisi.DIPINJAM: return "warning";
      case Kondisi.RUSAK_BERAT:
      case Kondisi.HILANG: return "destructive";
      default: return "outline";
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case "CREATE": return { label: "Menambahkan Aset", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "UPDATE": return { label: "Memperbarui Aset", color: "bg-amber-100 text-amber-700 border-amber-200" };
      case "DELETE": return { label: "Menghapus Aset", color: "bg-rose-100 text-rose-700 border-rose-200" };
      default: return { label: action, color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" };
    }
  };

  return (
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Ringkasan data inventaris dan aktivitas perubahan aset SKPD.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/assets/tambah" prefetch={false}>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
                <Boxes className="h-4 w-4" />
                Tambah Aset Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar mb-6">
        <button
          onClick={() => setActiveTab("ringkasan")}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "ringkasan"
              ? "border-emerald-600 text-emerald-800 dark:text-emerald-400"
              : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Activity className="h-4 w-4" />
          Ringkasan Utama
        </button>
        <button
          onClick={() => setActiveTab("analitik")}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "analitik"
              ? "border-emerald-600 text-emerald-800 dark:text-emerald-400"
              : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <PieChartIcon className="h-4 w-4" />
          Analitik Aset
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "log"
              ? "border-emerald-600 text-emerald-800 dark:text-emerald-400"
              : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <HistoryIcon className="h-4 w-4" />
          Log Aktivitas
        </button>
      </div>

      {/* TAB: RINGKASAN UTAMA */}
      <div className={activeTab === "ringkasan" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>
        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card accent="emerald" className="relative overflow-hidden lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Total Nilai Aset</p>
                  <h3 className="text-2xl font-black text-zinc-950 mt-1">{formatRupiah(metrics.totalValue || 0)}</h3>
                </div>
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
                <span>Nilai buku total inventaris SKPD</span>
              </div>
            </CardContent>
          </Card>

          <Card accent="sky" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Total Aset</p>
                  <h3 className="text-3xl font-bold text-sky-800 mt-1">{metrics.total}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card accent="emerald" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Kondisi Baik</p>
                  <h3 className="text-3xl font-bold text-emerald-800 mt-1">{metrics.normal}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card accent="amber" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Rusak Ringan</p>
                  <h3 className="text-3xl font-bold text-amber-800 mt-1">{metrics.rusakRingan}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card accent="rose" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Rusak Berat</p>
                  <h3 className="text-3xl font-bold text-rose-800 mt-1">{metrics.rusakBerat}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card accent="emerald">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex-1">
                <CardTitle>Aset Terbaru</CardTitle>
                <CardDescription>Daftar 5 barang inventaris yang baru saja didaftarkan.</CardDescription>
              </div>
              <Link href="/assets" className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:underline">
                Semua Aset <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-0 pt-2">
              {latestAssets.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500">
                  Belum ada data aset terdaftar.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {latestAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="font-semibold text-sm truncate text-zinc-950 dark:text-zinc-100">
                          {asset.merkType ? `${asset.namaAset} - ${asset.merkType}` : asset.namaAset}
                        </span>
                        <span className="text-xs text-emerald-800 dark:text-emerald-400 font-mono font-semibold mt-0.5">
                          {asset.kodeLengkap}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1 truncate">
                          Bidang: {asset.distribution.nama} • Pemegang: {asset.holder?.nama || "Gudang / Umum"}
                        </span>
                      </div>
                      <Badge variant={getKondisiBadgeVariant(asset.kondisi)}>
                        {getKondisiLabel(asset.kondisi)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mutasi Terbaru Widget */}
          <Card accent="indigo">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex-1">
                <CardTitle>Mutasi Terbaru</CardTitle>
                <CardDescription>Daftar mutasi pemindahan aset terbaru.</CardDescription>
              </div>
              <Link href="/mutasi" className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:underline">
                Semua Mutasi <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 border-t">
              {recentMutations.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500 italic font-semibold">
                  Belum ada aktivitas mutasi aset tercatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-950 dark:text-zinc-100 font-bold">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Aset</th>
                        <th className="py-3 px-4">Jenis Mutasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium text-zinc-900 dark:text-zinc-300">
                      {recentMutations.slice(0, 5).map((m) => {
                        const getMutationTypeLabel = (type: any) => {
                          switch (type) {
                            case "HOLDER": return "Pemegang";
                            case "DISTRIBUTION": return "Distribusi";
                            case "CONDITION": return "Kondisi";
                            case "MULTIPLE": return "Ganda";
                            default: return type;
                          }
                        };
                        return (
                          <tr key={m.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60 transition-colors">
                            <td className="py-3 px-4 font-semibold whitespace-nowrap">
                              {formatDate(m.createdAt).split(" ")[0]}
                            </td>
                            <td className="py-3 px-4 min-w-[200px]">
                              <p className="font-bold">{m.asset.namaAset}</p>
                              <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">{m.asset.kodeLengkap}</p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300 text-[10px] whitespace-nowrap">
                                {getMutationTypeLabel(m.mutationType)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TAB: ANALITIK */}
      <div className={activeTab === "analitik" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>
        {/* Trend Area Chart Row */}
        <Card accent="sky">
          <CardHeader>
            <CardTitle>Tren Pembelian / Perolehan Aset</CardTitle>
            <CardDescription>Grafik jumlah aset berdasarkan tahun pembelian.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {charts.byTahun && charts.byTahun.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.byTahun} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="stroke-slate-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "8px", 
                      backgroundColor: "var(--color-card)", 
                      borderColor: "var(--color-border)",
                      color: "var(--color-foreground)"
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">Tidak ada data tahun pembelian.</div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card accent="violet">
            <CardHeader>
              <CardTitle>Kategori Aset Utama</CardTitle>
              <CardDescription>Distribusi 5 kelompok aset terbanyak.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex flex-col justify-between pt-4">
              {charts.byType.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">Tidak ada data.</div>
              ) : (
                <>
                  <div className="h-60 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={charts.byType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total">
                          {charts.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {charts.byType.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-slate-600 dark:text-zinc-400 font-medium">{item.name} ({item.total})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card accent="emerald">
            <CardHeader>
              <CardTitle>Sebaran KIB</CardTitle>
              <CardDescription>Visualisasi jumlah aset berdasarkan kelompok KIB.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex flex-col justify-between pt-4">
              {kibChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">Tidak ada data KIB.</div>
              ) : (
                <>
                  <div className="h-60 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={kibChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {kibChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={KIB_COLORS[index % KIB_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {kibChartData.map((item, index) => (
                      <div key={item.kode} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: KIB_COLORS[index % KIB_COLORS.length] }} />
                        <span className="truncate text-slate-600 dark:text-zinc-400 font-medium">KIB {item.kode} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card accent="sky">
            <CardHeader>
              <CardTitle>Aset per Bidang Kerja</CardTitle>
              <CardDescription>Distribusi kepemilikan barang inventaris per bidang.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              {charts.byDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">Tidak ada data bidang.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.byDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="stroke-slate-200 dark:stroke-zinc-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(14, 165, 233, 0.05)" }} contentStyle={{ borderRadius: "8px", backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
                    <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card accent="amber">
            <CardHeader>
              <CardTitle>Status Kondisi Aset</CardTitle>
              <CardDescription>Perbandingan jumlah aset berdasarkan kondisi fisik.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kondisiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="stroke-slate-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(245, 158, 11, 0.05)" }} contentStyle={{ borderRadius: "8px", backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {kondisiChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TAB: LOG AKTIVITAS */}
      <div className={activeTab === "log" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>
        <Card accent="indigo">
          <CardHeader>
            <CardTitle>Log Audit Perubahan Data</CardTitle>
            <CardDescription>Catatan perubahan data yang dilakukan oleh Operator & Admin.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {recentLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                Belum ada aktivitas log tercatat.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentLogs.map((log) => {
                  const actionDetails = formatAction(log.action);
                  return (
                    <div key={log.id} className="flex gap-4 p-4 items-start text-sm rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/20 hover:shadow-xs transition-all">
                      <div className="mt-0.5">
                        <span className={`font-mono text-[10px] font-bold uppercase border px-2 py-1 rounded-md ${actionDetails.color}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-900 dark:text-zinc-100 font-medium text-base">
                          <span className="font-semibold">{log.user.nama}</span>
                          {" "}{actionDetails.label.toLowerCase()}{" "}
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{log.asset.namaAset}</span>
                          {log.asset.merkType ? ` (${log.asset.merkType})` : ""}
                        </p>
                        <p className="text-xs font-mono font-semibold text-zinc-500 mt-1">Kode Reg: {log.asset.kodeLengkap}</p>
                        <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
