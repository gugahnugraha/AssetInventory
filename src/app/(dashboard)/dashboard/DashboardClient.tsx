"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User, 
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
  Legend
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
      case Kondisi.NORMAL:
        return "Normal";
      case Kondisi.RUSAK_RINGAN:
        return "Rusak Ringan";
      case Kondisi.RUSAK_BERAT:
        return "Rusak Berat";
      case Kondisi.HILANG:
        return "Hilang";
      case Kondisi.DALAM_PERBAIKAN:
        return "Dalam Perbaikan";
      case Kondisi.DIPINJAM:
        return "Dipinjam";
      default:
        return kondisi;
    }
  };

  const getKondisiBadgeVariant = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL:
        return "success";
      case Kondisi.RUSAK_RINGAN:
      case Kondisi.DALAM_PERBAIKAN:
      case Kondisi.DIPINJAM:
        return "warning";
      case Kondisi.RUSAK_BERAT:
      case Kondisi.HILANG:
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case "CREATE":
        return { label: "Menambahkan Aset", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      case "UPDATE":
        return { label: "Memperbarui Aset", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "DELETE":
        return { label: "Menghapus Aset", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
      default:
        return { label: action, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" };
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Ringkasan data inventaris dan aktivitas perubahan aset OPD.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/assets/tambah" prefetch={false}>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-xs hover:shadow-emerald-600/10 cursor-pointer">
              <Boxes className="h-4 w-4" />
              Tambah Aset Baru
            </button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Assets */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Aset</p>
                <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{metrics.total}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Boxes className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              <span>Aset terdaftar di OPD</span>
            </div>
          </CardContent>
        </Card>

        {/* Kondisi Normal */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kondisi Baik</p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.normal}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>{Math.round((metrics.normal / (metrics.total || 1)) * 100)}% dari total aset</span>
            </div>
          </CardContent>
        </Card>

        {/* Rusak Ringan */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rusak Ringan</p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{metrics.rusakRingan}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>Aset butuh pemeliharaan</span>
            </div>
          </CardContent>
        </Card>

        {/* Rusak Berat */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rusak Berat</p>
                <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{metrics.rusakBerat}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>Perlu penghapusan aset</span>
            </div>
          </CardContent>
        </Card>

        {/* Hilang */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Aset Hilang</p>
                <h3 className="text-3xl font-extrabold text-rose-800 dark:text-rose-500 mt-1">{metrics.hilang}</h3>
              </div>
              <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-xl">
                <HelpCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>Sedang ditelusuri</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Asset per Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aset per Bidang Kerja (Distribusi)</CardTitle>
            <CardDescription>Grafik distribusi jumlah kepemilikan barang inventaris per bidang.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {charts.byDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Tidak ada data distribusi bidang.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "8px", 
                      backgroundColor: "var(--color-card)", 
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))"
                    }}
                    cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart: Asset per Type */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori/Jenis Aset Utama</CardTitle>
            <CardDescription>Pembagian aset berdasarkan 5 kelompok jenis aset terbanyak.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-between">
            {charts.byType.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
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
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))"
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {charts.byType.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate text-zinc-600 dark:text-zinc-400 font-medium" title={item.name}>
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
        {/* Latest Assets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Aset Terbaru</CardTitle>
              <CardDescription>Daftar 5 barang inventaris yang baru saja didaftarkan.</CardDescription>
            </div>
            <Link href="/assets" prefetch={false} className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:underline">
              Semua Aset
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {latestAssets.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Belum ada data aset terdaftar.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {latestAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-50">
                        {asset.merkType ? `${asset.namaAset} - ${asset.merkType}` : asset.namaAset}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {asset.kodeLengkap}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
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

        {/* Recent Operations Log Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Aktivitas Log Audit</CardTitle>
              <CardDescription>Catatan perubahan data yang dilakukan oleh Operator & Admin.</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent className="px-0">
            {recentLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Belum ada aktivitas log tercatat.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentLogs.map((log) => {
                  const actionDetails = formatAction(log.action);
                  return (
                    <div key={log.id} className="flex gap-3 p-4 items-start text-sm">
                      <div className="mt-0.5">
                        <Badge className="font-medium text-[10px] uppercase border px-1.5 py-0" variant="outline">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-700 dark:text-zinc-300">
                          <span className="font-bold text-zinc-900 dark:text-zinc-50">{log.user.nama}</span>
                          {" "}{actionDetails.label.toLowerCase()}{" "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{log.asset.namaAset}</span>
                          {log.asset.merkType ? ` (${log.asset.merkType})` : ""}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Kode: {log.asset.kodeLengkap}</p>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-medium">
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
