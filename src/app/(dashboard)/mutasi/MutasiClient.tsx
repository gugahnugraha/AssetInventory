"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Download, 
  User, 
  MapPin, 
  History,
  AlertTriangle,
  Loader2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { createAssetMutationAction } from "@/actions/history";
import { Role, MutationType, Kondisi } from "@prisma/client";

interface MutasiClientProps {
  histories: any[];
  assets: any[];
  distributions: any[];
  holders: any[];
  userRole: Role;
  preselectedAssetId?: string;
}

export function MutasiClient({
  histories,
  assets,
  distributions,
  holders,
  userRole,
  preselectedAssetId
}: MutasiClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [assetSearch, setAssetSearch] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<any>(null);
  const [showAssetDropdown, setShowAssetDropdown] = React.useState(false);
  const [toDistributionId, setToDistributionId] = React.useState("");
  const [toHolderId, setToHolderId] = React.useState("");
  const [toCondition, setToCondition] = React.useState<Kondisi | "">("");
  const [beritaAcaraNumber, setBeritaAcaraNumber] = React.useState("");
  const [beritaAcaraDate, setBeritaAcaraDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Auto pre-select asset if parameter exists in query params
  React.useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      const asset = assets.find(a => a.id === preselectedAssetId);
      if (asset) {
        setSelectedAsset(asset);
        setAssetSearch(`${asset.namaAset} (${asset.kodeLengkap})`);
        // Pre-populate target fields with current values as defaults
        setToDistributionId(asset.distributionId);
        setToHolderId(asset.holderId || "");
        setToCondition(asset.kondisi);
        setIsOpen(true);
      }
    }
  }, [preselectedAssetId, assets]);

  // Reset form helper
  const resetForm = () => {
    setSelectedAsset(null);
    setAssetSearch("");
    setToDistributionId("");
    setToHolderId("");
    setToCondition("");
    setBeritaAcaraNumber("");
    setBeritaAcaraDate("");
    setDescription("");
    setSelectedFile(null);
    setError(null);
  };

  // Filter main transfers table list
  const filteredHistories = React.useMemo(() => {
    if (!searchQuery.trim()) return histories;
    return histories.filter((h) => 
      h.asset.namaAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.asset.kodeLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.beritaAcaraNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [histories, searchQuery]);

  // Filter assets when searching in autocomplete input
  const filteredAssetsForSelect = React.useMemo(() => {
    if (!assetSearch.trim()) return assets.slice(0, 15);
    return assets.filter(
      (a) =>
        a.namaAset.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.kodeLengkap.toLowerCase().includes(assetSearch.toLowerCase())
    );
  }, [assets, assetSearch]);

  // Filter holders based on selected target distribution
  const filteredHoldersForSelect = React.useMemo(() => {
    if (!selectedAsset) return [];
    // If a destination distribution is selected, filter holders by it. Otherwise fallback to current distribution.
    const distId = toDistributionId || selectedAsset.distributionId;
    return holders.filter((h) => h.distributionId === distId);
  }, [holders, selectedAsset, toDistributionId]);

  const getKondisiLabel = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL: return "Normal (Baik)";
      case Kondisi.RUSAK_RINGAN: return "Rusak Ringan";
      case Kondisi.RUSAK_BERAT: return "Rusak Berat";
      case Kondisi.HILANG: return "Hilang";
      case Kondisi.DALAM_PERBAIKAN: return "Dalam Perbaikan";
      case Kondisi.DIPINJAM: return "Dipinjam";
      default: return kondisi;
    }
  };

  const getMutationTypeLabel = (type: MutationType) => {
    switch (type) {
      case MutationType.HOLDER: return "Pemegang Barang";
      case MutationType.DISTRIBUTION: return "Distribusi Aset";
      case MutationType.CONDITION: return "Kondisi Aset";
      case MutationType.MULTIPLE: return "Mutasi Ganda";
      default: return type;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === Role.MANAGER) return;

    setError(null);
    setIsSubmitting(true);

    if (!selectedAsset) {
      setError("Silakan pilih aset terlebih dahulu.");
      setIsSubmitting(false);
      return;
    }
    if (!beritaAcaraNumber.trim()) {
      setError("Nomor Berita Acara wajib diisi.");
      setIsSubmitting(false);
      return;
    }
    if (!beritaAcaraDate) {
      setError("Tanggal Berita Acara wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const distId = toDistributionId || selectedAsset.distributionId;
    const holdId = toHolderId || null;
    const cond = toCondition || selectedAsset.kondisi;

    const holderChanged = (selectedAsset.holderId || null) !== holdId;
    const distributionChanged = selectedAsset.distributionId !== distId;
    const conditionChanged = selectedAsset.kondisi !== cond;

    if (!holderChanged && !distributionChanged && !conditionChanged) {
      setError("Harus ada minimal satu data (Penempatan Bidang, Pemegang Barang, atau Kondisi) yang diubah.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("assetId", selectedAsset.id);
    formData.append("toDistributionId", distId);
    formData.append("toHolderId", holdId || "");
    formData.append("toCondition", cond);
    formData.append("beritaAcaraNumber", beritaAcaraNumber);
    formData.append("beritaAcaraDate", beritaAcaraDate);
    formData.append("description", description);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const result = await createAssetMutationAction(formData);
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else if (result.success) {
        setIsOpen(false);
        resetForm();
        router.refresh();
      }
    } catch (err) {
      console.error("Error creating mutation:", err);
      setError("Terjadi kesalahan sistem saat memproses mutasi aset.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 pt-0 pb-8 -mt-6">
        {/* Hero Header Banner */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2 flex items-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full border border-emerald-100 dark:border-emerald-800 hidden sm:block">
                <ArrowRightLeft className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm flex items-center gap-2">
                  Mutasi Aset
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Kelola mutasi penempatan bidang kerja, pemegang barang, dan kondisi aset.
                </p>
              </div>
            </div>
            {userRole !== Role.MANAGER && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button 
                  onClick={() => { resetForm(); setIsOpen(true); }} 
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Buat Mutasi Baru
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <Search className="h-5 w-5 text-zinc-550 shrink-0" />
          <Input
            placeholder="Cari berdasarkan nama aset, kode lengkap, atau nomor berita acara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-zinc-500 font-medium"
          />
        </div>

        {/* Mutations List Table */}
        <Card className="border-zinc-200/85 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {filteredHistories.length === 0 ? (
              <div className="text-center py-16 text-zinc-800 font-semibold italic">
                Belum ada data mutasi aset yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-100/80 text-zinc-950 font-bold">
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Aset</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Tanggal Mutasi</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Jenis Mutasi</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Dari (Lama)</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Ke (Baru)</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Berita Acara</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950">Pengguna</th>
                      <th className="py-3.5 px-4 font-bold text-zinc-950 text-right">Berkas BA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-900 font-medium">
                    {filteredHistories.map((h) => {
                      return (
                        <tr key={h.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 px-4 min-w-[200px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-950">{h.asset.namaAset}</span>
                              <span className="text-xs font-semibold text-emerald-850 font-mono mt-0.5">{h.asset.kodeLengkap}</span>
                              {h.asset.merkType && (
                                <span className="text-[11px] text-zinc-800 font-normal mt-0.5">Merk: {h.asset.merkType}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-zinc-950 whitespace-nowrap">
                            {formatDate(h.createdAt)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold uppercase text-[9px]">
                              {getMutationTypeLabel(h.mutationType)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-xs space-y-1.5">
                            {h.fromDistribution && (
                              <div>
                                <span className="font-semibold text-zinc-700">Distribusi: </span>
                                <span className="text-zinc-900 font-bold">{h.fromDistribution.nama}</span>
                              </div>
                            )}
                            {h.fromHolder && (
                              <div>
                                <span className="font-semibold text-zinc-700">Pemegang: </span>
                                <span className="text-zinc-900 font-bold">{h.fromHolder.nama}</span>
                              </div>
                            )}
                            {h.fromCondition && (
                              <div>
                                <span className="font-semibold text-zinc-700">Kondisi: </span>
                                <span className="text-zinc-950 font-bold">{getKondisiLabel(h.fromCondition)}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs space-y-1.5">
                            {h.toDistribution && (
                              <div>
                                <span className="font-semibold text-zinc-700">Distribusi: </span>
                                <span className="text-emerald-800 font-bold">{h.toDistribution.nama}</span>
                              </div>
                            )}
                            {h.toHolder && (
                              <div>
                                <span className="font-semibold text-zinc-700">Pemegang: </span>
                                <span className="text-emerald-800 font-bold">{h.toHolder.nama}</span>
                              </div>
                            )}
                            {h.toCondition && (
                              <div>
                                <span className="font-semibold text-zinc-700">Kondisi: </span>
                                <span className="text-emerald-850 font-bold">{getKondisiLabel(h.toCondition)}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs space-y-0.5">
                            <div className="font-bold text-zinc-950">No: {h.beritaAcaraNumber}</div>
                            <div className="text-zinc-800 font-semibold">
                              Tgl: {new Date(h.beritaAcaraDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs whitespace-nowrap text-zinc-800">
                            {h.creator.nama}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {h.documents && h.documents.length > 0 ? (
                              <a
                                href={h.documents[0].fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-800 hover:text-emerald-700 font-bold hover:underline text-xs flex items-center justify-end gap-1.5"
                              >
                                Unduh BA
                              </a>
                            ) : (
                              <span className="text-zinc-400 italic text-xs">Tidak ada</span>
                            )}
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

      {/* Mutation Form Modal */}
      <Dialog isOpen={isOpen} onClose={() => { if (!isSubmitting) { setIsOpen(false); resetForm(); } }} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
            Buat Mutasi Aset Baru
          </DialogTitle>
          <DialogDescription>
            Pindahkan aset dengan melengkapi bidang penempatan, pemegang penanggung jawab, atau kondisi terbaru aset.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Aset & Tujuan Penempatan Baru */}
            <div className="space-y-4">
              {/* Autocomplete Asset Search */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-zinc-705 uppercase tracking-wider flex items-center gap-1">
                  Cari Aset <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Ketik nama aset atau kode lengkap..."
                    value={assetSearch}
                    onChange={(e) => {
                      setAssetSearch(e.target.value);
                      setSelectedAsset(null);
                      setShowAssetDropdown(true);
                    }}
                    onFocus={() => setShowAssetDropdown(true)}
                    disabled={isSubmitting || !!preselectedAssetId}
                    className="font-medium bg-white"
                  />
                  <Search className="h-4 w-4 text-zinc-400 absolute right-3 top-2.5" />
                </div>

                {/* Dropdown list for autocomplete */}
                {showAssetDropdown && assetSearch.length > 0 && !selectedAsset && (
                  <div className="absolute z-50 w-full left-0 mt-1 max-h-48 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-lg divide-y text-sm">
                    {filteredAssetsForSelect.length === 0 ? (
                      <div className="p-3 text-zinc-500 italic text-center">Aset tidak ditemukan.</div>
                    ) : (
                      filteredAssetsForSelect.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedAsset(a);
                            setAssetSearch(`${a.namaAset} (${a.kodeLengkap})`);
                            // Prepopulate default fields
                            setToDistributionId(a.distributionId);
                            setToHolderId(a.holderId || "");
                            setToCondition(a.kondisi);
                            setShowAssetDropdown(false);
                          }}
                          className="p-3 hover:bg-zinc-50 cursor-pointer text-zinc-900 transition-colors border-b last:border-0"
                        >
                          {/* Top row: Name & Condition */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-950 truncate text-sm">{a.namaAset}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${
                              a.kondisi === "NORMAL"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-250/30"
                                : a.kondisi === "RUSAK_BERAT" || a.kondisi === "HILANG"
                                ? "bg-rose-50 text-rose-700 border-rose-250/30"
                                : "bg-amber-50 text-amber-700 border-amber-250/30"
                            }`}>
                              {getKondisiLabel(a.kondisi)}
                            </span>
                          </div>

                          {/* Middle row: Code & Merk/Type */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 mt-1 font-mono">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-400">{a.kodeLengkap}</span>
                            {a.merkType && <span className="truncate max-w-[200px] text-zinc-400 mt-0.5 sm:mt-0 font-sans">Merk: {a.merkType}</span>}
                          </div>

                          {/* Bottom row: Penempatan (Bidang) & Pemegang */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-400 mt-1.5 border-t border-zinc-100 pt-1.5">
                            <span>
                              Bidang: <strong className="text-zinc-650">{a.distributionName}</strong>
                            </span>
                             <span className="mt-0.5 sm:mt-0">
                               Pemegang: <strong className="text-zinc-650">{a.holderName || "Gudang / Umum"}</strong>
                             </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Current Asset Info Summary Box */}
              {selectedAsset && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-2 text-zinc-800 font-medium">
                  <div className="font-bold text-zinc-900 border-b border-zinc-200/60 pb-1 mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-zinc-500" />
                    Informasi Aset Saat Ini
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Bidang Lama:</span>
                      <span className="font-bold text-zinc-900 truncate max-w-[180px]">{selectedAsset.distributionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pemegang Lama:</span>
                      <span className="font-bold text-zinc-900 truncate max-w-[180px]">{selectedAsset.holderName || "Gudang / Umum"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Kondisi Lama:</span>
                      <span className="font-bold text-zinc-900">{getKondisiLabel(selectedAsset.kondisi)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Mutasi Inputs */}
              {selectedAsset && (
                <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl space-y-3.5">
                  <div className="font-bold text-xs text-emerald-850 uppercase tracking-wider border-b border-emerald-100/50 pb-1 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600" />
                    Data Mutasi Baru (Tujuan)
                  </div>
                  <div className="space-y-3">
                    {/* Target Distribution Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Distribusi Aset Baru (Bidang)
                      </label>
                      <select
                        value={toDistributionId}
                        onChange={(e) => {
                          setToDistributionId(e.target.value);
                          setToHolderId(""); // Reset holder when distribution changes
                        }}
                        disabled={isSubmitting}
                        className="w-full h-9 rounded-md border border-input bg-white text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                      >
                        {distributions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Holder Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Pemegang Barang Baru
                      </label>
                      <select
                        value={toHolderId}
                        onChange={(e) => setToHolderId(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-9 rounded-md border border-input bg-white text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                      >
                        <option value="">Tanpa Pemegang (Gudang/Umum)</option>
                        {filteredHoldersForSelect.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nama} ({h.jabatan})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Condition Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Kondisi Aset Baru
                      </label>
                      <select
                        value={toCondition}
                        onChange={(e) => setToCondition(e.target.value as Kondisi)}
                        disabled={isSubmitting}
                        className="w-full h-9 rounded-md border border-input bg-white text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                      >
                        <option value={Kondisi.NORMAL}>{getKondisiLabel(Kondisi.NORMAL)}</option>
                        <option value={Kondisi.RUSAK_RINGAN}>{getKondisiLabel(Kondisi.RUSAK_RINGAN)}</option>
                        <option value={Kondisi.RUSAK_BERAT}>{getKondisiLabel(Kondisi.RUSAK_BERAT)}</option>
                        <option value={Kondisi.DALAM_PERBAIKAN}>{getKondisiLabel(Kondisi.DALAM_PERBAIKAN)}</option>
                        <option value={Kondisi.DIPINJAM}>{getKondisiLabel(Kondisi.DIPINJAM)}</option>
                        <option value={Kondisi.HILANG}>{getKondisiLabel(Kondisi.HILANG)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Berita Acara & Dokumen Pendukung */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Section Header */}
                <div className="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-zinc-400" />
                  Administrasi Berita Acara
                </div>

                {/* Berita Acara Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Nomor Berita Acara <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: BA/MUTASI/08/VIII/2026"
                    value={beritaAcaraNumber}
                    onChange={(e) => setBeritaAcaraNumber(e.target.value)}
                    disabled={isSubmitting}
                    className="font-medium bg-white"
                  />
                </div>

                {/* Berita Acara Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Tanggal Berita Acara <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={beritaAcaraDate}
                    onChange={(e) => setBeritaAcaraDate(e.target.value)}
                    disabled={isSubmitting}
                    className="font-medium bg-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Keterangan Alasan Mutasi
                  </label>
                  <textarea
                    placeholder="Masukkan alasan perpindahan penempatan barang atau perubahan kondisi..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                  />
                </div>

                {/* File Document Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Unggah Dokumen Berita Acara (PDF/Gambar)
                  </label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    disabled={isSubmitting}
                    className="font-semibold cursor-pointer bg-white"
                  />
                  <p className="text-[10px] text-zinc-500">Format pendukung: PDF, JPG, JPEG, PNG (Maks. 5MB)</p>
                </div>
              </div>

              {/* Empty placeholder or spacing helper */}
              <div className="hidden md:block h-6"></div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpen(false); resetForm(); }}
              disabled={isSubmitting}
              className="font-semibold cursor-pointer"
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer min-w-32"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1 justify-center">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Simpan & Mutasi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
