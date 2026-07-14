"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Plus,
  CalendarRange,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";

interface DashboardRekonClientProps {
  stats: {
    totalAssets: number;
    totalRekon: number;
    belumDirekon: number;
    sesuai: number;
    tidakSesuai: number;
    progress: number;
    criticalFindings: number;
  };
  recentRecons: any[];
  recentFindings: any[];
  activePeriod: any;
  periods: any[];
  userRole: Role;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SESUAI") return <Badge variant="success" className="text-[10px]">Sesuai</Badge>;
  if (status === "TIDAK_SESUAI") return <Badge variant="destructive" className="text-[10px]">Tidak Sesuai</Badge>;
  return <Badge variant="outline" className="text-[10px] text-zinc-500">Belum Direkonsiliasi</Badge>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-rose-100 text-rose-800 border-rose-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    LOW: "bg-blue-100 text-blue-800 border-blue-200",
  };
  const label: Record<string, string> = { CRITICAL: "Kritis", HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Rendah" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[severity] || "bg-zinc-100 text-zinc-700"}`}>
      {label[severity] || severity}
    </span>
  );
}

export function DashboardRekonClient({
  stats,
  recentRecons,
  recentFindings,
  activePeriod,
  periods,
  userRole,
}: DashboardRekonClientProps) {
  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-emerald-600" />
            Dashboard Rekonsiliasi
          </h1>
          <p className="text-zinc-500 mt-1">
            Ringkasan pemeriksaan aset dan temuan rekonsiliasi{activePeriod ? ` — ${activePeriod.nama}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === Role.ADMINISTRATOR && (
            <Link href="/rekonsiliasi/periode">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-2">
                <Plus className="h-4 w-4" />
                Kelola Periode
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Active Period Banner */}
      {activePeriod ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CalendarRange className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900">Periode Aktif: {activePeriod.nama}</p>
            <p className="text-xs text-emerald-700">
              Triwulan {activePeriod.triwulan} — Tahun {activePeriod.tahun} &nbsp;·&nbsp;
              Status: <span className="font-bold uppercase">{activePeriod.status}</span>
            </p>
          </div>
          <Link href={`/rekonsiliasi/periode/${activePeriod.id}`}>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-100">
              Lihat Detail <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Tidak ada periode rekonsiliasi yang aktif.</p>
            <p className="text-xs text-amber-700">Buat periode baru di menu Periode Rekonsiliasi untuk memulai.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Aset</p>
                <p className="text-3xl font-bold text-zinc-950 mt-1">{stats.totalAssets}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-100">
                <BarChart3 className="h-5 w-5 text-zinc-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Direkonsiliasi</p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.totalRekon}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sesuai</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.sesuai}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tidak Sesuai</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">{stats.tidakSesuai}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50">
                <XCircle className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar + Critical */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-zinc-200/80">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Progress Rekonsiliasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-700">{stats.totalRekon} dari {stats.totalAssets} aset</span>
              <span className="text-2xl font-bold text-emerald-700">{stats.progress}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div className="bg-zinc-50 rounded-lg p-2">
                <p className="text-zinc-500">Belum</p>
                <p className="font-bold text-zinc-700 text-base">{stats.belumDirekon}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2">
                <p className="text-emerald-600">Sesuai</p>
                <p className="font-bold text-emerald-700 text-base">{stats.sesuai}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-2">
                <p className="text-rose-600">Tidak Sesuai</p>
                <p className="font-bold text-rose-700 text-base">{stats.tidakSesuai}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Temuan Kritis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col items-center justify-center gap-2">
            <div className={`text-5xl font-black ${stats.criticalFindings > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {stats.criticalFindings}
            </div>
            <p className="text-xs text-zinc-500 text-center">
              {stats.criticalFindings > 0 ? "Temuan kritis belum terselesaikan" : "Tidak ada temuan kritis"}
            </p>
            {stats.criticalFindings > 0 && (
              <Link href="/rekonsiliasi/temuan">
                <Button variant="outline" size="sm" className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer mt-1">
                  Lihat Temuan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reconciliations */}
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              10 Rekonsiliasi Terbaru
            </CardTitle>
            <Link href="/rekonsiliasi/pemeriksaan">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-700 cursor-pointer">
                Lihat Semua <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentRecons.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">Belum ada rekonsiliasi.</div>
            ) : (
              <div className="divide-y">
                {recentRecons.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{r.asset.namaAset}</p>
                      <p className="text-xs text-zinc-500 font-mono">{r.asset.kodeLengkap}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={r.status} />
                      {r._count.findings > 0 && (
                        <span className="text-[10px] text-rose-600 font-semibold">{r._count.findings} temuan</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Findings */}
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              10 Temuan Terbaru
            </CardTitle>
            <Link href="/rekonsiliasi/temuan">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-700 cursor-pointer">
                Lihat Semua <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentFindings.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">Tidak ada temuan aktif.</div>
            ) : (
              <div className="divide-y">
                {recentFindings.map((f) => (
                  <div key={f.id} className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-zinc-900 truncate">{f.reconciliation.asset.namaAset}</p>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-1">{f.description}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{f.reconciliation.asset.kodeLengkap}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
