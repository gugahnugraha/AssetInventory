"use client";

import * as React from "react";
import { ClipboardCheck, Search, Filter, CheckCircle2, XCircle, Clock, AlertTriangle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";
import { startReconciliationAction } from "@/actions/reconciliation";
import { useRouter } from "next/navigation";

interface PemeriksaanClientProps {
  assets: any[];
  activePeriod: any;
  reconStatusMap: Record<string, { status: string; reconId: string | null }>;
  userRole: Role;
}

function RekonBadge({ status }: { status: string }) {
  if (status === "SESUAI") return <Badge variant="success" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Sesuai</Badge>;
  if (status === "TIDAK_SESUAI") return <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="h-3 w-3" />Tidak Sesuai</Badge>;
  return <Badge variant="outline" className="text-[10px] text-zinc-400 gap-1"><Clock className="h-3 w-3" />Belum Direkon</Badge>;
}

export function PemeriksaanClient({ assets, activePeriod, reconStatusMap, userRole }: PemeriksaanClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("ALL");
  const [filterBidang, setFilterBidang] = React.useState("ALL");
  const [startingId, setStartingId] = React.useState<string | null>(null);

  const canWrite = userRole !== Role.MANAGER;

  // Unique bidang for filter
  const bidangList = React.useMemo(() => {
    const set = new Set(assets.map((a) => a.distribution?.nama).filter(Boolean));
    return Array.from(set) as string[];
  }, [assets]);

  const filtered = assets.filter((a) => {
    const rekonStatus = reconStatusMap[a.id]?.status ?? "BELUM_DIREKON";
    const matchSearch =
      a.namaAset.toLowerCase().includes(search.toLowerCase()) ||
      a.kodeLengkap.toLowerCase().includes(search.toLowerCase()) ||
      (a.holder?.nama || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || rekonStatus === filterStatus;
    const matchBidang = filterBidang === "ALL" || a.distribution?.nama === filterBidang;
    return matchSearch && matchStatus && matchBidang;
  });

  const handleStart = async (assetId: string) => {
    if (!activePeriod) return;
    const rekonInfo = reconStatusMap[assetId];
    if (rekonInfo?.reconId) {
      router.push(`/rekonsiliasi/pemeriksaan/${rekonInfo.reconId}`);
      return;
    }
    setStartingId(assetId);
    const res = await startReconciliationAction(activePeriod.id, assetId);
    setStartingId(null);
    if (res.error) { alert(res.error); return; }
    if (res.data?.id) router.push(`/rekonsiliasi/pemeriksaan/${res.data.id}`);
  };

  if (!activePeriod) {
    return (
      <div className="space-y-6 pt-2 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-emerald-600" /> Pemeriksaan Aset
          </h1>
        </div>
        <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Tidak ada periode rekonsiliasi yang aktif (OPEN).</p>
            <p className="text-xs text-amber-700">Hubungi Administrator untuk membuat atau membuka periode rekonsiliasi.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full border border-emerald-100 dark:border-emerald-800 hidden sm:block">
              <ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Pemeriksaan Aset
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Pilih aset untuk diperiksa — <span className="font-semibold text-emerald-700">{activePeriod.nama}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Badge variant="success" className="text-xs">Periode Aktif: {activePeriod.nama}</Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-zinc-200/80">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari aset, kode, pemegang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm"
              >
                <option value="ALL">Semua Status</option>
                <option value="BELUM_DIREKON">Belum Direkon</option>
                <option value="SESUAI">Sesuai</option>
                <option value="TIDAK_SESUAI">Tidak Sesuai</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterBidang}
                onChange={(e) => setFilterBidang(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm"
              >
                <option value="ALL">Semua Bidang</option>
                {bidangList.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset table */}
      <Card className="border-zinc-200/80 overflow-hidden">
        <CardHeader className="border-b bg-zinc-50 py-3 px-4">
          <CardTitle className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
            {filtered.length} aset ditampilkan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm">Tidak ada aset yang sesuai filter.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((a) => {
                const info = reconStatusMap[a.id] ?? { status: "BELUM_DIREKON", reconId: null };
                const isStarting = startingId === a.id;
                return (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                    {a.fotoUtama ? (
                      <img src={a.fotoUtama} alt={a.namaAset} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 border flex items-center justify-center shrink-0">
                        <ClipboardCheck className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-zinc-900 truncate">{a.namaAset}</p>
                        <RekonBadge status={info.status} />
                      </div>
                      <div className="text-xs text-zinc-500 flex flex-wrap gap-2 mt-0.5">
                        <span className="font-mono">{a.kodeLengkap}</span>
                        {a.distribution && <span>· {a.distribution.nama}</span>}
                        {a.holder && <span>· {a.holder.nama}</span>}
                        <span>· {a.tahunPembelian}</span>
                      </div>
                    </div>
                    {canWrite && (
                      <Button
                        size="sm"
                        onClick={() => handleStart(a.id)}
                        disabled={isStarting}
                        variant={info.reconId ? "outline" : "default"}
                        className={`cursor-pointer text-xs shrink-0 gap-1 ${!info.reconId ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                      >
                        {isStarting ? "Memulai..." : info.reconId ? <><Play className="h-3 w-3" />Lanjut</> : <><Play className="h-3 w-3" />Mulai</>}
                      </Button>
                    )}
                    {!canWrite && info.reconId && (
                      <Button size="sm" variant="outline" onClick={() => router.push(`/rekonsiliasi/pemeriksaan/${info.reconId}`)} className="cursor-pointer text-xs">
                        Lihat
                      </Button>
                    )}
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
