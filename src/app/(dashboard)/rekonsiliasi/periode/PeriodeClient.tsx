"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  CalendarRange,
  Lock,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import { createPeriodAction, lockPeriodAction, closePeriodAction } from "@/actions/reconciliation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Period {
  id: string;
  nama: string;
  semester: number;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
  creator: { nama: string };
  _count: { reconciliations: number };
}

interface PeriodeClientProps {
  periods: Period[];
  userRole: Role;
}

function PeriodStatusBadge({ status }: { status: string }) {
  if (status === "OPEN") return <Badge variant="success" className="gap-1"><Clock className="h-3 w-3" /> Terbuka</Badge>;
  if (status === "LOCKED") return <Badge variant="warning" className="gap-1"><Lock className="h-3 w-3" /> Terkunci</Badge>;
  return <Badge variant="outline" className="gap-1 text-zinc-500"><CheckCircle2 className="h-3 w-3" /> Ditutup</Badge>;
}

export function PeriodeClient({ periods, userRole }: PeriodeClientProps) {
  const [showCreate, setShowCreate] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [lockTarget, setLockTarget] = React.useState<string | null>(null);
  const [closeTarget, setCloseTarget] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    nama: "",
    semester: 1,
    tahun: new Date().getFullYear(),
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const handleCreate = async () => {
    if (!form.nama || !form.tanggalMulai || !form.tanggalSelesai) {
      setError("Semua field wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await createPeriodAction(form);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setShowCreate(false);
    window.location.reload();
  };

  const handleLock = async () => {
    if (!lockTarget) return;
    const res = await lockPeriodAction(lockTarget);
    if (res.error) alert(res.error);
    setLockTarget(null);
    window.location.reload();
  };

  const handleClose = async () => {
    if (!closeTarget) return;
    const res = await closePeriodAction(closeTarget);
    if (res.error) alert(res.error);
    setCloseTarget(null);
    window.location.reload();
  };

  const isAdmin = userRole === Role.ADMINISTRATOR;

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <CalendarRange className="h-7 w-7 text-emerald-600" />
            Periode Rekonsiliasi
          </h1>
          <p className="text-zinc-500 mt-1">Kelola periode rekonsiliasi aset inventaris OPD.</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-2"
          >
            <Plus className="h-4 w-4" /> Buat Periode Baru
          </Button>
        )}
      </div>

      {/* List */}
      {periods.length === 0 ? (
        <Card className="border-zinc-200/80">
          <CardContent className="p-12 text-center">
            <CalendarRange className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-semibold">Belum ada periode rekonsiliasi.</p>
            {isAdmin && (
              <p className="text-sm text-zinc-400 mt-1">
                Klik &quot;Buat Periode Baru&quot; untuk memulai.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {periods.map((p) => (
            <Card key={p.id} className="border-zinc-200/80 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-zinc-900">{p.nama}</h3>
                    <PeriodStatusBadge status={p.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span>Semester {p.semester} — {p.tahun}</span>
                    <span>·</span>
                    <span>
                      {new Date(p.tanggalMulai).toLocaleDateString("id-ID")} s/d {new Date(p.tanggalSelesai).toLocaleDateString("id-ID")}
                    </span>
                    <span>·</span>
                    <span>{p._count.reconciliations} aset direkonsiliasi</span>
                    <span>·</span>
                    <span>Dibuat oleh {p.creator.nama}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && p.status === "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer"
                      onClick={() => setLockTarget(p.id)}
                    >
                      <Lock className="h-3 w-3 mr-1" /> Kunci
                    </Button>
                  )}
                  {isAdmin && p.status === "LOCKED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                      onClick={() => setCloseTarget(p.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Tutup
                    </Button>
                  )}
                  <Link href={`/rekonsiliasi/periode/${p.id}`}>
                    <Button variant="outline" size="sm" className="text-xs cursor-pointer gap-1">
                      Detail <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Periode Rekonsiliasi Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Nama Periode *</label>
              <Input
                placeholder="Rekonsiliasi Semester I Tahun 2026"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Semester *</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={1}>Semester I</option>
                  <option value={2}>Semester II</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Tahun *</label>
                <Input
                  type="number"
                  min={2000}
                  max={2099}
                  value={form.tahun}
                  onChange={(e) => setForm({ ...form, tahun: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Tanggal Mulai *</label>
                <Input
                  type="date"
                  value={form.tanggalMulai}
                  onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Tanggal Selesai *</label>
                <Input
                  type="date"
                  value={form.tanggalSelesai}
                  onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={loading} className="cursor-pointer">
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
              {loading ? "Menyimpan..." : "Buat Periode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Confirm */}
      <ConfirmDialog
        isOpen={!!lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={handleLock}
        title="Kunci Periode?"
        description="Setelah dikunci, tidak ada rekonsiliasi baru yang bisa dimulai. Operator masih bisa mengisi rekonsiliasi yang sudah dimulai."
        confirmLabel="Ya, Kunci"
        variant="warning"
      />

      {/* Close Confirm */}
      <ConfirmDialog
        isOpen={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleClose}
        title="Tutup Periode?"
        description="Periode akan ditutup permanen. Tidak ada perubahan lebih lanjut yang bisa dilakukan."
        confirmLabel="Ya, Tutup"
        variant="destructive"
      />
    </div>
  );
}
