"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Boxes, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  XCircle,
  Wrench,
  HelpCircle
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
    };
    latestAssets: any[];
  };
  recentLogs: any[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function DashboardClient({ stats, recentLogs }: DashboardClientProps) {
  const { metrics, charts, latestAssets } = stats;

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
    <div className="space-y-6 pt-2 pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="text-zinc-800 font-medium mt-1">
            Ringkasan data inventaris dan aktivitas perubahan aset OPD.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/assets/tambah" prefetch={false}>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer">
              <Boxes className="h-4 w-4" />
              Tambah Aset Baru
            </button>
          </Link>
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
          <CardHeader>
            <CardTitle>Aset per Bidang Kerja (Distribusi)</CardTitle>
            <CardDescription>Grafik distribusi jumlah kepemilikan barang inventaris per bidang.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
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
        </Card>

        <Card accent="violet">
          <CardHeader>
            <CardTitle>Kategori/Jenis Aset Utama</CardTitle>
            <CardDescription>Pembagian aset berdasarkan 5 kelompok jenis aset terbanyak.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-between">
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
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent="emerald">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Aset Terbaru</CardTitle>
              <CardDescription>Daftar 5 barang inventaris yang baru saja didaftarkan.</CardDescription>
            </div>
            <Link href="/assets" prefetch={false} className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:underline">
              Semua Aset
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
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
        </Card>

        <Card accent="indigo">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Aktivitas Log Audit</CardTitle>
              <CardDescription>Catatan perubahan data yang dilakukan oleh Operator & Admin.</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="px-0">
            {recentLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-zinc-500">
                Belum ada aktivitas log tercatat.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200/80">
                {recentLogs.map((log) => {
                  const actionDetails = formatAction(log.action);
                  return (
                    <div key={log.id} className="flex gap-3 p-4 items-start text-sm hover:bg-zinc-100/60 transition-colors">
                      <div className="mt-0.5">
                        <Badge className="font-semibold text-[10px] uppercase border px-1.5 py-0" variant="outline">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-900 font-medium">
                          <span className="font-semibold text-zinc-950">{log.user.nama}</span>
                          {" "}{actionDetails.label.toLowerCase()}{" "}
                          <span className="font-semibold text-emerald-850">{log.asset.namaAset}</span>
                          {log.asset.merkType ? ` (${log.asset.merkType})` : ""}
                        </p>
                        <p className="text-[11px] font-mono font-semibold text-zinc-800 mt-0.5">Kode: {log.asset.kodeLengkap}</p>
                        <p className="text-xs text-zinc-800 mt-1 flex items-center gap-1 font-medium">
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
        </Card>
      </div>
    </div>
  );
}
