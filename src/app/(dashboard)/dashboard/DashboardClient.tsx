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
  ChevronDown
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
    };
    charts: {
      byDistribution: { name: string; total: number }[];
      byType: { name: string; total: number }[];
      byKib: { name: string; kode: string; value: number }[];
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

  const [collapsedCards, setCollapsedCards] = React.useState<Record<string, boolean>>({
    distChart: false,
    catChart: false,
    kibChart: false,
    latestAssets: false,
    auditLogs: false,
    recentMutations: false,
  });

  const toggleCard = (cardId: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

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
    <div className="space-y-6 pt-0 pb-8 -mt-6">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">Dashboard</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Ringkasan data inventaris dan aktivitas perubahan aset OPD.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/assets/tambah" prefetch={false}>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
                <Boxes className="h-4 w-4" />
                Tambah Aset Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card accent="emerald" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Total Aset</p>
                <h3 className="text-3xl font-bold text-zinc-950 mt-1">{metrics.total}</h3>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Boxes className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
              <TrendingUp className="h-3 w-3 text-emerald-700 mr-1" />
              <span>Aset terdaftar di OPD</span>
            </div>
          </CardContent>
        </Card>

        <Card accent="sky" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Kondisi Baik</p>
                <h3 className="text-3xl font-bold text-emerald-800 mt-1">{metrics.normal}</h3>
              </div>
              <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
              <span>{Math.round((metrics.normal / (metrics.total || 1)) * 100)}% dari total aset</span>
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
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
              <span>Aset butuh pemeliharaan</span>
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
              <div className="p-3 bg-rose-100 text-rose-800 rounded-xl">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
              <span>Perlu penghapusan aset</span>
            </div>
          </CardContent>
        </Card>

        <Card accent="violet" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Aset Hilang</p>
                <h3 className="text-3xl font-bold text-violet-800 mt-1">{metrics.hilang}</h3>
              </div>
              <div className="p-3 bg-violet-100 text-violet-800 rounded-xl">
                <HelpCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-zinc-800 font-semibold">
              <span>Sedang ditelusuri</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card accent="sky" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("distChart")}>
            <div className="flex-1">
              <CardTitle>Aset per Bidang Kerja (Distribusi)</CardTitle>
              <CardDescription>Grafik distribusi jumlah kepemilikan barang inventaris per bidang.</CardDescription>
            </div>
            <button className="text-zinc-400 hover:text-zinc-650 transition-colors ml-4 shrink-0">
              {collapsedCards.distChart ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.distChart ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
            <CardContent className="h-80 pt-4">
              {charts.byDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-zinc-500">
                  Tidak ada data distribusi bidang.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.byDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      cursor={{ fill: "rgba(14, 165, 233, 0.05)" }}
                    />
                    <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </div>
        </Card>

        <Card accent="violet">
          <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("catChart")}>
            <div className="flex-1">
              <CardTitle>Kategori/Jenis Aset Utama</CardTitle>
              <CardDescription>Pembagian aset berdasarkan 5 kelompok jenis aset terbanyak.</CardDescription>
            </div>
            <button className="text-zinc-400 hover:text-zinc-650 transition-colors ml-4 shrink-0">
              {collapsedCards.catChart ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.catChart ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
            <CardContent className="h-80 flex flex-col justify-between pt-4">
              {charts.byType.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-zinc-500">
                  Tidak ada data kategori aset.
                </div>
              ) : (
                <>
                  <div className="h-60 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="total"
                        >
                          {charts.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: "8px", 
                            backgroundColor: "var(--color-card)", 
                            borderColor: "var(--color-border)",
                            color: "var(--color-foreground)"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {charts.byType.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-slate-600 dark:text-zinc-400 font-medium" title={item.name}>
                          {item.name} ({item.total})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* KIB Donut Chart Row */}
      <div className="grid grid-cols-1 gap-6">
        <Card accent="emerald">
          <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("kibChart")}>
            <div className="flex-1">
              <CardTitle>Sebaran Aset per KIB (Kartu Inventaris Barang)</CardTitle>
              <CardDescription>Visualisasi pembagian jumlah kepemilikan barang inventaris berdasarkan kelompok KIB A - F.</CardDescription>
            </div>
            <button className="text-zinc-400 hover:text-zinc-650 transition-colors ml-4 shrink-0">
              {collapsedCards.kibChart ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.kibChart ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
            <CardContent className="h-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-6 pt-4">
              {kibChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 w-full text-sm text-slate-400 dark:text-zinc-500">
                  Tidak ada data KIB tercatat.
                </div>
              ) : (
                <>
                  <div className="w-full md:w-1/3 h-64 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={kibChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {kibChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={KIB_COLORS[index % KIB_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-foreground)"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {kibChartData.map((item, index) => (
                      <div key={item.kode} className="p-3 rounded-lg border bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col justify-between hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: KIB_COLORS[index % KIB_COLORS.length] }} />
                          <span className="font-bold text-sm text-zinc-900">KIB {item.kode}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-semibold truncate mt-1">
                          {item.name.replace(`KIB ${item.kode} (`, '').replace(')', '')}
                        </p>
                        <h4 className="text-xl font-extrabold text-zinc-950 mt-3">{item.value} <span className="text-xs text-zinc-500 font-medium">Aset</span></h4>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent="emerald">
          <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("latestAssets")}>
            <div className="flex-1">
              <CardTitle>Aset Terbaru</CardTitle>
              <CardDescription>Daftar 5 barang inventaris yang baru saja didaftarkan.</CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/assets" prefetch={false} className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                Semua Aset
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button className="text-zinc-400 hover:text-zinc-650 transition-colors">
                {collapsedCards.latestAssets ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.latestAssets ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
            <CardContent className="px-0 pt-2">
              {latestAssets.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500">
                  Belum ada data aset terdaftar.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200/80">
                  {latestAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-zinc-100/60 transition-colors">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="font-semibold text-sm truncate text-zinc-950">
                          {asset.merkType ? `${asset.namaAset} - ${asset.merkType}` : asset.namaAset}
                        </span>
                        <span className="text-xs text-emerald-800 font-mono font-semibold mt-0.5">
                          {asset.kodeLengkap}
                        </span>
                        <span className="text-xs text-zinc-800 font-medium mt-1 truncate">
                          Bidang: {asset.distribution.nama} • Pemegang: {asset.holder?.nama || "Tidak ada"}
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
          </div>
        </Card>

        <Card accent="indigo">
          <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("auditLogs")}>
            <div className="flex-1">
              <CardTitle>Aktivitas Log Audit</CardTitle>
              <CardDescription>Catatan perubahan data yang dilakukan oleh Operator & Admin.</CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Clock className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <button className="text-zinc-400 hover:text-zinc-650 transition-colors">
                {collapsedCards.auditLogs ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.auditLogs ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
            <CardContent className="p-4 pt-2">
              {recentLogs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500">
                  Belum ada aktivitas log tercatat.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentLogs.map((log) => {
                    const actionDetails = formatAction(log.action);
                    return (
                      <div key={log.id} className="flex gap-3 p-3 items-start text-sm rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/20 hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                        <div className="mt-0.5">
                          <span className={`font-mono text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded-md ${actionDetails.color}`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                            <span className="font-semibold text-zinc-950 dark:text-zinc-50">{log.user.nama}</span>
                            {" "}{actionDetails.label.toLowerCase()}{" "}
                            <span className="font-semibold text-emerald-850 dark:text-emerald-450">{log.asset.namaAset}</span>
                            {log.asset.merkType ? ` (${log.asset.merkType})` : ""}
                          </p>
                          <p className="text-[10px] font-mono font-semibold text-zinc-500 mt-1">Kode: {log.asset.kodeLengkap}</p>
                          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Mutasi Terbaru Widget */}
      <Card accent="emerald" className="border-zinc-200/80">
        <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none" onClick={() => toggleCard("recentMutations")}>
          <div className="flex-1">
            <CardTitle>Mutasi Terbaru</CardTitle>
            <CardDescription>Daftar 10 mutasi pemindahan aset terbaru.</CardDescription>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/mutasi" className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:underline" onClick={(e) => e.stopPropagation()}>
              Semua Mutasi
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button className="text-zinc-400 hover:text-zinc-650 transition-colors">
              {collapsedCards.recentMutations ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </CardHeader>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedCards.recentMutations ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"}`}>
          <CardContent className="p-0 border-t">
            {recentMutations.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500 italic font-semibold">
                Belum ada aktivitas mutasi aset tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-950 font-bold">
                      <th className="py-3 px-4 font-bold text-zinc-950">Tanggal</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Kode Aset</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Nama Aset</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Jenis Mutasi</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Pemegang Baru</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Distribusi Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium text-zinc-900">
                    {recentMutations.map((m) => {
                      const getMutationTypeLabel = (type: any) => {
                        switch (type) {
                          case "HOLDER": return "Pemegang Barang";
                          case "DISTRIBUTION": return "Distribusi Aset";
                          case "CONDITION": return "Kondisi Aset";
                          case "MULTIPLE": return "Mutasi Ganda";
                          default: return type;
                        }
                      };
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-zinc-950 whitespace-nowrap">
                            {formatDate(m.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-emerald-800 font-mono">
                            {m.asset.kodeLengkap}
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-950">
                            {m.asset.namaAset} {m.asset.merkType ? `(${m.asset.merkType})` : ""}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-100 font-bold uppercase text-[9px] whitespace-nowrap">
                              {getMutationTypeLabel(m.mutationType)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-zinc-900 font-bold">
                            {m.toHolder?.nama || "Gudang / Umum"}
                          </td>
                          <td className="py-3 px-4 text-emerald-800 font-bold">
                            {m.toDistribution?.nama || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
