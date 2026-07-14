"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import { lockPeriodAction, closePeriodAction, startReconciliationAction } from "@/actions/reconciliation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";

interface PeriodeDetailClientProps {
  period: any;
  stats: any;
  totalAssets: number;
  userRole: Role;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SESUAI") return <Badge variant="success" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Sesuai</Badge>;
  if (status === "TIDAK_SESUAI") return <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="h-3 w-3" />Tidak Sesuai</Badge>;
  return <Badge variant="outline" className="text-[10px] text-zinc-500 gap-1"><Clock className="h-3 w-3" />Belum Direkon</Badge>;
}

export function PeriodeDetailClient({ period, stats, totalAssets, userRole }: PeriodeDetailClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("ALL");
  const [lockConfirm, setLockConfirm] = React.useState(false);
  const [closeConfirm, setCloseConfirm] = React.useState(false);
  const [startingId, setStartingId] = React.useState<string | null>(null);

  const isAdmin = userRole === Role.ADMINISTRATOR;
  const canEdit = userRole !== Role.MANAGER && period.status === "OPEN";

  // Filter reconciliations
  const filteredRecons: any[] = period.reconciliations.filter((r: any) => {
    const matchSearch =
      r.asset.namaAset.toLowerCase().includes(search.toLowerCase()) ||
      r.asset.kodeLengkap.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStartRecon = async (assetId: string) => {
    setStartingId(assetId);
    const res = await startReconciliationAction(period.id, assetId);
    setStartingId(null);
    if (res.error) { alert(res.error); return; }
    if (res.data?.id) router.push(`/rekonsiliasi/pemeriksaan/${res.data.id}`);
  };

  const handleLock = async () => {
    const res = await lockPeriodAction(period.id);
    if (res.error) { alert(res.error); return; }
    setLockConfirm(false);
    window.location.reload();
  };

  const handleClose = async () => {
    const res = await closePeriodAction(period.id);
    if (res.error) { alert(res.error); return; }
    setCloseConfirm(false);
    window.location.reload();
  };

  const statusLabel: Record<string, string> = {
    OPEN: "Terbuka",
    LOCKED: "Terkunci",
    CLOSED: "Ditutup",
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Header */}
      <div>
        <Link href="/rekonsiliasi/periode" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-emerald-700 mb-3 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Periode
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-950">{period.nama}</h1>
              <Badge variant={period.status === "OPEN" ? "success" : period.status === "LOCKED" ? "warning" : "outline"}>
                {statusLabel[period.status]}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              Triwulan {period.triwulan} — {period.tahun} &nbsp;·&nbsp;
              {new Date(period.tanggalMulai).toLocaleDateString("id-ID")} s/d {new Date(period.tanggalSelesai).toLocaleDateString("id-ID")}
              &nbsp;·&nbsp; Dibuat oleh {period.creator.nama}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && period.status === "OPEN" && (
              <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer gap-1" onClick={() => setLockConfirm(true)}>
                <Lock className="h-3.5 w-3.5" /> Kunci Periode
              </Button>
            )}
            {isAdmin && period.status === "LOCKED" && (
              <Button variant="outline" size="sm" className="border-zinc-200 cursor-pointer gap-1" onClick={() => setCloseConfirm(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Tutup Periode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Aset", value: totalAssets, color: "text-zinc-700", bg: "bg-zinc-50" },
          { label: "Direkonsiliasi", value: stats.totalRekon, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Sesuai", value: stats.sesuai, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Tidak Sesuai", value: stats.tidakSesuai, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <Card key={s.label} className="border-zinc-200/80">
            <CardContent className={`p-4 ${s.bg} rounded-xl`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card className="border-zinc-200/80">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500 font-semibold">Progress Rekonsiliasi</span>
              <span className="font-bold text-emerald-700">{stats.progress}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }} />
            </div>
          </div>
          <span className="text-xs text-zinc-500 shrink-0">{stats.totalRekon}/{totalAssets}</span>
        </CardContent>
      </Card>

      {/* Asset List with filter */}
      <Card className="border-zinc-200/80">
        <CardHeader className="border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Daftar Rekonsiliasi Aset
            </CardTitle>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Cari aset..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-48"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2"
              >
                <option value="ALL">Semua Status</option>
                <option value="BELUM_DIREKON">Belum Direkon</option>
                <option value="SESUAI">Sesuai</option>
                <option value="TIDAK_SESUAI">Tidak Sesuai</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecons.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm">
              {period.reconciliations.length === 0
                ? "Belum ada aset yang direkonsiliasi dalam periode ini."
                : "Tidak ada aset yang sesuai dengan filter."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRecons.map((r: any) => (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-zinc-900">{r.asset.namaAset}</p>
                      <StatusBadge status={r.status} />
                      {r._count.findings > 0 && (
                        <Badge variant="destructive" className="text-[10px]">{r._count.findings} temuan</Badge>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      <span className="font-mono">{r.asset.kodeLengkap}</span>
                      {r.asset.distribution && <span> · {r.asset.distribution.nama}</span>}
                      {r.checker && <span> · Diperiksa: {r.checker.nama}</span>}
                    </div>
                  </div>
                  <Link href={`/rekonsiliasi/pemeriksaan/${r.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer text-xs gap-1">
                      <Eye className="h-3 w-3" /> Buka
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog isOpen={lockConfirm} onClose={() => setLockConfirm(false)} onConfirm={handleLock} title="Kunci Periode?" description="Setelah dikunci, tidak ada rekonsiliasi baru yang bisa dimulai." confirmLabel="Kunci" variant="warning" />
      <ConfirmDialog isOpen={closeConfirm} onClose={() => setCloseConfirm(false)} onConfirm={handleClose} title="Tutup Periode?" description="Periode akan ditutup secara permanen. Tidak ada perubahan lebih lanjut." confirmLabel="Tutup" variant="danger" />
    </div>
  );
}
