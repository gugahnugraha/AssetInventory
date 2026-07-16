"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Save,
  ArrowRightLeft,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import { saveReconciliationAction, addFindingAction, resolveFindingAction } from "@/actions/reconciliation";
import { formatDate, formatRupiah } from "@/lib/utils";

const FINDING_TYPE_LABELS: Record<string, string> = {
  DATA_PEMEGANG: "Data Pemegang Barang",
  DATA_DISTRIBUSI: "Data Distribusi/Bidang",
  KONDISI: "Kondisi Aset",
  LABEL: "Label Inventaris",
  FOTO: "Foto Aset",
  DOKUMEN: "Kelengkapan Dokumen",
  ASET_TIDAK_DITEMUKAN: "Aset Tidak Ditemukan",
  ASET_RUSAK: "Aset Rusak",
  ASET_HILANG: "Aset Hilang",
  LAINNYA: "Lainnya",
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  MUTASI_ASET: "Mutasi Aset",
  PERBAIKAN_DATA: "Perbaikan Data",
  PENGHAPUSAN_ASET: "Penghapusan Aset",
  UPLOAD_DOKUMEN: "Upload Dokumen",
  PENGADAAN_LABEL: "Pengadaan Label",
  TIDAK_ADA: "Tidak Ada",
};

const REKON_BADGE_MAP: Record<string, [string, string]> = {
  SESUAI: ["bg-emerald-100 text-emerald-800 border-emerald-200", "Sesuai"],
  TIDAK_SESUAI: ["bg-rose-100 text-rose-800 border-rose-200", "Tidak Sesuai"],
  BELUM_DIREKON: ["bg-zinc-100 text-zinc-600 border-zinc-200", "Belum Direkonsiliasi"],
};

const SEVERITY_MAP: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 border-rose-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-blue-100 text-blue-800 border-blue-200",
};

const KONDISI_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
  DALAM_PERBAIKAN: "Dalam Perbaikan",
  DIPINJAM: "Dipinjam",
};

interface FormPemeriksaanClientProps {
  recon: any;
  userRole: Role;
  currentUserId: string;
}

export function FormPemeriksaanClient({ recon, userRole, currentUserId }: FormPemeriksaanClientProps) {
  const asset = recon.asset;
  const period = recon.period;
  const canEdit = userRole !== Role.MANAGER && period.status === "OPEN";

  // Checklist state
  const [checklists, setChecklists] = React.useState(
    recon.checklists.map((c: any) => ({ ...c }))
  );
  const [notes, setNotes] = React.useState(recon.notes || "");
  const [saving, setSaving] = React.useState(false);
  const [saveResult, setSaveResult] = React.useState<{ status?: string; error?: string } | null>(null);

  // Finding dialog
  const [showFinding, setShowFinding] = React.useState(false);
  const [findingForm, setFindingForm] = React.useState({
    findingType: "LAINNYA",
    severity: "MEDIUM",
    description: "",
    recommendation: "TIDAK_ADA",
  });
  const [addingFinding, setAddingFinding] = React.useState(false);
  const [findingError, setFindingError] = React.useState("");

  const allChecked = checklists.every((c: any) => c.checked);
  const autoStatus = allChecked ? "SESUAI" : "TIDAK_SESUAI";

  const handleChecklistToggle = (id: string) => {
    if (!canEdit) return;
    setChecklists((prev: any[]) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    const res = await saveReconciliationAction(
      recon.id,
      checklists.map((c: any) => ({ id: c.id, checked: c.checked, notes: c.notes })),
      notes
    );
    setSaving(false);
    if (res.error) setSaveResult({ error: res.error });
    else setSaveResult({ status: res.status });
  };

  const handleAddFinding = async () => {
    if (!findingForm.description.trim()) {
      setFindingError("Deskripsi temuan wajib diisi.");
      return;
    }
    setAddingFinding(true);
    setFindingError("");
    const res = await addFindingAction(recon.id, findingForm as any);
    setAddingFinding(false);
    if (res.error) { setFindingError(res.error); return; }
    setShowFinding(false);
    setFindingForm({ findingType: "LAINNYA", severity: "MEDIUM", description: "", recommendation: "TIDAK_ADA" });
    window.location.reload();
  };

  const handleResolveFinding = async (findingId: string) => {
    await resolveFindingAction(findingId);
    window.location.reload();
  };

  const [rekonBadgeClass, rekonBadgeLabel] = REKON_BADGE_MAP[recon.status] ?? REKON_BADGE_MAP.BELUM_DIREKON;

  // Mutation-triggering finding types
  const mutationFindings = recon.findings.filter((f: any) =>
    ["DATA_PEMEGANG", "DATA_DISTRIBUSI", "KONDISI"].includes(f.findingType)
  );
  const dataFixFindings = recon.findings.filter((f: any) =>
    ["LABEL", "FOTO", "DOKUMEN", "LAINNYA"].includes(f.findingType)
  );

  return (
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <Link href="/rekonsiliasi/pemeriksaan" prefetch={false}>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{asset.namaAset}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${rekonBadgeClass}`}>
                {rekonBadgeLabel}
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{asset.kodeLengkap}</span> &nbsp;·&nbsp;
              Periode: <span className="font-semibold">{period.nama}</span>
              {recon.checker && <span> &nbsp;·&nbsp; Pemeriksa: {recon.checker.nama}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Asset Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Foto */}
          <Card className="border-zinc-200/80 overflow-hidden">
            {asset.fotoUtama ? (
              <img src={asset.fotoUtama} alt={asset.namaAset} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-zinc-100 flex items-center justify-center">
                <ClipboardCheck className="h-10 w-10 text-zinc-300" />
              </div>
            )}
          </Card>

          {/* Info Aset */}
          <Card className="border-zinc-200/80">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Informasi Aset</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-sm">
              {[
                ["Nama Aset", asset.namaAset],
                ["Kode Aset", <span className="font-mono font-bold text-emerald-700">{asset.kodeLengkap}</span>],
                ["Merk / Tipe", asset.merkType],
                ["Kategori", asset.category?.nama],
                ["Tahun", asset.tahunPembelian],
                ["Harga", formatRupiah(asset.harga || 0)],
                ["Kondisi", <Badge variant={asset.kondisi === "NORMAL" ? "success" : "warning"} className="text-xs">{KONDISI_LABELS[asset.kondisi] || asset.kondisi}</Badge>],
                ["Distribusi/Bidang", asset.distribution?.nama || "-"],
                ["Pemegang Barang", asset.holder?.nama || "-"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-start justify-between gap-2">
                  <span className="text-zinc-500 shrink-0 text-xs">{label}</span>
                  <span className="font-semibold text-zinc-900 text-right text-xs">{val as any}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Riwayat Mutasi Terbaru */}
          {asset.history && asset.history.length > 0 && (
            <Card className="border-zinc-200/80">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Riwayat Mutasi Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {asset.history.map((h: any) => (
                  <div key={h.id} className="text-xs bg-zinc-50 rounded-lg p-2 border">
                    <p className="font-semibold text-zinc-700">{h.mutationType.replace("_", " ")}</p>
                    <p className="text-zinc-500">{h.beritaAcaraNumber} · {formatDate(h.beritaAcaraDate)}</p>
                    {h.toHolder && <p>→ {h.toHolder.nama}</p>}
                    {h.toDistribution && <p>→ {h.toDistribution.nama}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Checklist + Findings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Checklist */}
          <Card className="border-zinc-200/80">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Checklist Pemeriksaan
                </CardTitle>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${allChecked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-700"}`}>
                  {checklists.filter((c: any) => c.checked).length}/{checklists.length} terpenuhi
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {checklists.map((c: any, i: number) => (
                <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${c.checked ? "bg-emerald-50 border-emerald-200" : "bg-zinc-50 border-zinc-200"}`}>
                  <button
                    onClick={() => handleChecklistToggle(c.id)}
                    disabled={!canEdit}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${canEdit ? "cursor-pointer" : "cursor-default opacity-70"} ${c.checked ? "bg-emerald-500 border-emerald-500" : "bg-white border-zinc-300"}`}
                  >
                    {c.checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${c.checked ? "text-emerald-800" : "text-zinc-700"}`}>
                      {c.checklistItem}
                    </p>
                    {canEdit && !c.checked && (
                      <input
                        type="text"
                        placeholder="Catatan (opsional)..."
                        value={c.notes || ""}
                        onChange={(e) => setChecklists((prev: any[]) =>
                          prev.map((cl) => cl.id === c.id ? { ...cl, notes: e.target.value } : cl)
                        )}
                        className="mt-1 w-full text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    )}
                    {!canEdit && c.notes && <p className="text-xs text-zinc-500 mt-1">{c.notes}</p>}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Catatan Umum</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="Catatan hasil pemeriksaan..."
                  className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none disabled:bg-zinc-50"
                />
              </div>

              {/* Status Preview */}
              {canEdit && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${autoStatus === "SESUAI" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  {autoStatus === "SESUAI"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <XCircle className="h-5 w-5 text-amber-600" />}
                  <div>
                    <p className="text-sm font-bold text-zinc-800">
                      Status akan otomatis menjadi: <span className={autoStatus === "SESUAI" ? "text-emerald-700" : "text-amber-700"}>{autoStatus === "SESUAI" ? "Sesuai" : "Tidak Sesuai"}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {autoStatus === "TIDAK_SESUAI" && "Minimal satu checklist belum terpenuhi. Wajib tambah temuan."}
                    </p>
                  </div>
                </div>
              )}

              {saveResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold ${saveResult.error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
                  {saveResult.error ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saveResult.error || `Berhasil disimpan. Status: ${saveResult.status === "SESUAI" ? "Sesuai ✅" : "Tidak Sesuai ⚠️"}`}
                </div>
              )}

              {canEdit && (
                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Hasil Pemeriksaan"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Findings */}
          <Card className="border-zinc-200/80">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Temuan Rekonsiliasi
                  {recon.findings.length > 0 && (
                    <Badge variant="destructive" className="text-[10px]">{recon.findings.length}</Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setShowFinding(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer text-xs gap-1">
                    <Plus className="h-3 w-3" /> Tambah Temuan
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recon.findings.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">Belum ada temuan.</p>
              ) : (
                recon.findings.map((f: any) => (
                  <div key={f.id} className={`p-3 rounded-xl border ${f.resolved ? "bg-zinc-50 opacity-60" : "bg-white"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_MAP[f.severity]}`}>
                            {SEVERITY_LABELS[f.severity]}
                          </span>
                          <span className="text-xs font-semibold text-zinc-700">{FINDING_TYPE_LABELS[f.findingType]}</span>
                          {f.resolved && <Badge variant="success" className="text-[10px]">Selesai</Badge>}
                        </div>
                        <p className="text-sm text-zinc-800">{f.description}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Rekomendasi: <span className="font-semibold">{RECOMMENDATION_LABELS[f.recommendation]}</span>
                        </p>
                      </div>
                      {canEdit && !f.resolved && (
                        <Button size="sm" variant="outline" className="text-xs cursor-pointer shrink-0" onClick={() => handleResolveFinding(f.id)}>
                          Selesai
                        </Button>
                      )}
                    </div>

                    {/* Quick action buttons based on finding type */}
                    {!f.resolved && canEdit && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["DATA_PEMEGANG", "DATA_DISTRIBUSI", "KONDISI"].includes(f.findingType) && (
                          <Link href={`/mutasi?assetId=${asset.id}`}>
                            <Button size="sm" variant="outline" className="text-xs cursor-pointer gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                              <ArrowRightLeft className="h-3 w-3" /> Buat Mutasi Aset
                            </Button>
                          </Link>
                        )}
                        {["LABEL", "FOTO", "DOKUMEN", "LAINNYA"].includes(f.findingType) && (
                          <Link href={`/assets/${asset.id}/edit`}>
                            <Button size="sm" variant="outline" className="text-xs cursor-pointer gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                              <FileEdit className="h-3 w-3" /> Ajukan Perbaikan Data
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Finding Dialog */}
      <Dialog isOpen={showFinding} onClose={() => setShowFinding(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Temuan Rekonsiliasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {findingError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{findingError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Jenis Temuan *</label>
                <select
                  value={findingForm.findingType}
                  onChange={(e) => setFindingForm({ ...findingForm, findingType: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(FINDING_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Tingkat Keparahan *</label>
                <select
                  value={findingForm.severity}
                  onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Deskripsi Temuan *</label>
              <textarea
                value={findingForm.description}
                onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
                rows={3}
                placeholder="Jelaskan temuan secara detail..."
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Rekomendasi</label>
              <select
                value={findingForm.recommendation}
                onChange={(e) => setFindingForm({ ...findingForm, recommendation: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(RECOMMENDATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinding(false)} disabled={addingFinding} className="cursor-pointer">Batal</Button>
            <Button onClick={handleAddFinding} disabled={addingFinding} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
              {addingFinding ? "Menyimpan..." : "Tambah Temuan"}
            </Button>
          </DialogFooter>
      </Dialog>
    </div>
  );
}
