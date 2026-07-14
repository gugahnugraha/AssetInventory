"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  Shield, 
  User, 
  Tag, 
  MapPin, 
  Info,
  Clock,
  History,
  AlertTriangle,
  ImageIcon,
  ArrowRightLeft,
  Star
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { deleteAssetAction, deleteAssetPhotoAction, setPrimaryPhotoAction } from "@/actions/asset";
import { Kondisi, Role, MutationType } from "@prisma/client";
import { useRouter } from "next/navigation";

interface AssetDetailClientProps {
  asset: any;
  userRole: Role;
  reconHistory?: any[];
}

export function AssetDetailClient({ asset, userRole, reconHistory = [] }: AssetDetailClientProps) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = React.useState<string>(asset.fotoUtama || "/placeholder-asset.png");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"spec" | "history">("spec");
  const [isSubmittingPhoto, setIsSubmittingPhoto] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // Sync active photo if asset changes or uploads complete
  React.useEffect(() => {
    if (asset.fotoUtama) {
      setActivePhoto(asset.fotoUtama);
    }
  }, [asset.fotoUtama]);

  const selectedDoc = React.useMemo(() => {
    return asset.photos?.find((p: any) => p.url === activePhoto);
  }, [asset.photos, activePhoto]);

  const handleSetPrimary = async () => {
    if (!selectedDoc || userRole === Role.MANAGER) return;
    setIsSubmittingPhoto(true);
    try {
      const res = await setPrimaryPhotoAction(asset.id, selectedDoc.id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Gagal mengubah foto utama.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedDoc || userRole === Role.MANAGER) return;
    if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;
    setIsSubmittingPhoto(true);
    try {
      const res = await deleteAssetPhotoAction(asset.id, selectedDoc.id);
      if (res.success) {
        // Find next active photo
        const remaining = asset.photos.filter((p: any) => p.id !== selectedDoc.id);
        setActivePhoto(remaining.length > 0 ? remaining[0].url : "/placeholder-asset.png");
        router.refresh();
      } else {
        alert(res.error || "Gagal menghapus foto.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const getKondisiLabel = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL:
        return "Normal (Baik)";
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

  const handleDelete = () => {
    if (userRole === Role.MANAGER) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const res = await deleteAssetAction(asset.id);
      if (res.success) {
        router.push("/assets");
        router.refresh();
      }
    } catch (err) {
      console.error("Delete asset detail error:", err);
    }
  };

  // Function to translate raw audit logs diff to human-friendly text
  const parseDiff = (log: any) => {
    if (log.action === "CREATE") {
      return "Aset pertama kali didaftarkan ke dalam sistem.";
    }
    if (log.action === "DELETE") {
      return "Aset dihapus dari sistem.";
    }

    try {
      const oldObj = JSON.parse(log.oldValue || "{}");
      const newObj = JSON.parse(log.newValue || "{}");
      const changes: string[] = [];

      if (oldObj.kondisi !== newObj.kondisi) {
        changes.push(`Kondisi berubah dari "${getKondisiLabel(oldObj.kondisi)}" menjadi "${getKondisiLabel(newObj.kondisi)}"`);
      }
      if (oldObj.holderId !== newObj.holderId) {
        changes.push(`Penanggung jawab (pemegang barang) diperbarui`);
      }
      if (oldObj.distributionId !== newObj.distributionId) {
        changes.push(`Lokasi penempatan bidang diperbarui`);
      }
      if (oldObj.jenisAset !== newObj.jenisAset || oldObj.merkType !== newObj.merkType) {
        changes.push(`Spesifikasi barang (jenis/merk) disunting`);
      }
      if (oldObj.catatan !== newObj.catatan) {
        changes.push(`Catatan keterangan diperbarui`);
      }
      if (oldObj.fotoUtama !== newObj.fotoUtama) {
        changes.push(`Foto dokumentasi utama diubah`);
      }

      return changes.length > 0 ? changes.join(", ") : "Perubahan informasi data aset.";
    } catch (e) {
      return "Penyuntingan data aset.";
    }
  };

  return (
    <>
    <div className="space-y-6 pt-2 pb-8">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/assets" prefetch={false}>
            <Button variant="outline" size="icon" className="rounded-full h-8 w-8 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Detail Aset</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-mono text-sm">
              Kode Lengkap: {asset.kodeLengkap}
            </p>
          </div>
        </div>

        {userRole !== Role.MANAGER && (
          <div className="flex items-center gap-2">
            <Link href={`/mutasi?assetId=${asset.id}`} prefetch={false}>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs font-semibold">
                <ArrowRightLeft className="h-4 w-4" />
                Mutasi Aset
              </Button>
            </Link>
            <Link href={`/assets/${asset.id}/edit`} prefetch={false}>
              <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-xs font-semibold">
                <Edit3 className="h-4 w-4" />
                Sunting Aset
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2 cursor-pointer font-semibold"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Aset
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("spec")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === "spec"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Detail & Spesifikasi Aset
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Riwayat Aset ({asset.history?.length || 0})
        </button>
      </div>

      {activeTab === "spec" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photos Gallery (Left column) */}
          <div className="space-y-4">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
              <div 
                className="relative aspect-4/3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-b cursor-zoom-in group"
                onClick={() => activePhoto && activePhoto !== "/placeholder-asset.png" && setIsLightboxOpen(true)}
              >
                {activePhoto && activePhoto !== "/placeholder-asset.png" ? (
                  <img
                    src={activePhoto}
                    alt={asset.namaAset}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <ImageIcon className="h-12 w-12" />
                    <span className="text-xs">Tidak ada foto dokumentasi</span>
                  </div>
                )}
                <Badge variant={getKondisiBadgeVariant(asset.kondisi)} className="absolute top-3 right-3 text-xs shadow-md">
                  {getKondisiLabel(asset.kondisi)}
                </Badge>
              </div>
              
              {/* Photo Actions for Admin/Operator */}
              {selectedDoc && userRole !== Role.MANAGER && (
                <div className="flex justify-between items-center px-4 py-2 bg-zinc-50 border-b gap-2">
                  {!selectedDoc.isPrimary ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSetPrimary}
                      disabled={isSubmittingPhoto}
                      className="text-xs h-8 cursor-pointer flex gap-1 items-center"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      Set Utama
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-250 flex gap-1 items-center">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      Foto Utama
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDeletePhoto}
                    disabled={isSubmittingPhoto}
                    className="text-xs h-8 text-rose-600 hover:text-rose-750 hover:bg-rose-50 cursor-pointer flex gap-1 items-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                </div>
              )}

              {/* Small thumbnails row */}
              {asset.photos && asset.photos.length > 0 && (
                <CardContent className="p-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {asset.photos.map((photo: any, index: number) => (
                      <button
                        key={photo.id}
                        onClick={() => setActivePhoto(photo.url)}
                        className={`relative w-16 h-12 rounded-md overflow-hidden border shrink-0 cursor-pointer ${
                          activePhoto === photo.url ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200"
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`Aset thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {photo.isPrimary && (
                          <div className="absolute top-0.5 right-0.5 bg-amber-500 rounded-full p-0.5 text-[6px]">
                            <Star className="h-1.5 w-1.5 fill-white text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Placement info */}
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Lokasi & Penempatan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Bidang Distribusi</p>
                    <p className="text-zinc-800 dark:text-zinc-400 mt-0.5 font-medium">{asset.distribution.nama}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Pemegang Barang (PJB)</p>
                    {asset.holder ? (
                      <div className="mt-0.5 space-y-0.5 font-medium">
                        <p className="text-zinc-950 dark:text-zinc-50 font-semibold">{asset.holder.nama}</p>
                        <p className="text-xs text-zinc-800 font-mono">NIP. {asset.holder.nip}</p>
                        <p className="text-xs text-zinc-800">{asset.holder.jabatan}</p>
                      </div>
                    ) : (
                      <p className="text-zinc-500 italic mt-0.5">Tidak ada (Disimpan di Gudang / Inventaris Umum)</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Specifications & Notes (Center column) */}
          <div className="space-y-6">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Spesifikasi & Identitas Barang
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 divide-y">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Nama Aset</span>
                  <span className="font-semibold text-zinc-950 dark:text-zinc-100">{asset.namaAset}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">KIB</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-bold">
                      KIB {asset.category?.kib?.kode || "B"} - {asset.category?.kib?.nama || "Peralatan dan Mesin"}
                    </Badge>
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Kategori</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-250">
                      {asset.category?.nama || "-"}
                    </Badge>
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Merk / Type</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{asset.merkType || "-"}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Material / Bahan</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{asset.material || "-"}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Cara Perolehan</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{asset.caraPerolehan || "-"}</span>
                </div>
                <div className="flex justify-between py-2 text-sm gap-4">
                  <span className="text-zinc-500 font-medium shrink-0">Spesifikasi</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200 text-right break-words max-w-[70%]">{asset.spesifikasi || "-"}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Harga Perolehan</span>
                  <span className="font-bold text-emerald-850 dark:text-emerald-400">Rp {asset.harga ? asset.harga.toLocaleString("id-ID") : "0"}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Tahun Pembelian</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{asset.tahunPembelian}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Nomor Register</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">{asset.nomorRegister}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-500 font-medium">Kode Bidang (Kelompok)</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    1.3.
                    {String(asset.kode1).padStart(2, '0')}.
                    {String(asset.kode2).padStart(2, '0')}.
                    {String(asset.kode3).padStart(2, '0')}.
                    {String(asset.kode4).padStart(2, '0')}.
                    {String(asset.kode5).padStart(2, '0')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Attributes Section */}
            {asset.attributes && asset.attributes.length > 0 && (
              <Card className="border-zinc-200/80 dark:border-zinc-800/80">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                    Atribut Tambahan ({asset.category?.nama})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 divide-y bg-zinc-50/20 dark:bg-zinc-900/10">
                  {asset.attributes.map((attr: any) => (
                    <div key={attr.id} className="flex justify-between py-2 text-sm">
                      <span className="text-zinc-500 font-medium">{attr.categoryAttribute?.nama}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-250">{attr.value || "-"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Catatan Card */}
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Keterangan & Catatan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-zinc-850 dark:text-zinc-300">
                {asset.catatan ? (
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">{asset.catatan}</p>
                ) : (
                  <p className="italic text-zinc-500 font-medium">Tidak ada catatan tambahan untuk aset ini.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audit History Timeline (Right column) */}
          <div className="space-y-6">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <History className="h-4 w-4" />
                  Riwayat Perubahan
                </CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-500 border-zinc-300">
                  Audit Trail
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                {asset.auditLogs.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground italic">
                    Belum ada riwayat perubahan data.
                  </div>
                ) : (
                  <div className="relative border-l border-zinc-250 dark:border-zinc-800 pl-4 space-y-6">
                    {asset.auditLogs.map((log: any) => (
                      <div key={log.id} className="relative text-sm">
                        {/* Timeline dot */}
                        <span className="absolute -left-6 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border border-white dark:border-zinc-950 shadow-xs" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.user.nama}</span>
                            <span className="text-[11px] font-semibold text-zinc-800 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-zinc-800 dark:text-zinc-400 leading-normal text-xs pt-0.5 font-medium">
                            {parseDiff(log)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Tab Riwayat Aset (Asset Mutation History) */
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Riwayat Aset
            </CardTitle>
            <CardDescription className="text-zinc-800 font-medium">
              Perjalanan data aset sejak pertama kali dicatat sampai kondisi terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!asset.history || asset.history.length === 0 ? (
              <div className="text-center py-12 text-zinc-800 font-semibold italic">
                Aset ini belum memiliki riwayat mutasi/perubahan data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-100/80 text-zinc-950 font-bold">
                      <th className="py-3 px-4 font-bold text-zinc-950">Tanggal</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Jenis Mutasi</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Pemegang Barang</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Distribusi Aset (Bidang)</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Kondisi Aset</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Berita Acara</th>
                      <th className="py-3 px-4 font-bold text-zinc-950">Pengguna</th>
                      <th className="py-3 px-4 font-bold text-zinc-950 text-right">Berkas BA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium text-zinc-900 text-xs">
                    {asset.history.map((h: any) => {
                      const getKondisiText = (k: Kondisi | null) => {
                        if (!k) return "-";
                        switch (k) {
                          case Kondisi.NORMAL: return "Normal";
                          case Kondisi.RUSAK_RINGAN: return "Rusak Ringan";
                          case Kondisi.RUSAK_BERAT: return "Rusak Berat";
                          case Kondisi.HILANG: return "Hilang";
                          case Kondisi.DALAM_PERBAIKAN: return "Perbaikan";
                          case Kondisi.DIPINJAM: return "Dipinjam";
                          default: return k;
                        }
                      };

                      const getMutationTypeText = (type: MutationType) => {
                        switch (type) {
                          case MutationType.HOLDER: return "Pemegang";
                          case MutationType.DISTRIBUTION: return "Distribusi";
                          case MutationType.CONDITION: return "Kondisi";
                          case MutationType.MULTIPLE: return "Mutasi Ganda";
                          default: return type;
                        }
                      };

                      return (
                        <tr key={h.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-4 px-4 font-semibold text-zinc-950 whitespace-nowrap">
                            {formatDate(h.createdAt)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold uppercase text-[9px] whitespace-nowrap">
                              {getMutationTypeText(h.mutationType)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 font-normal">{h.fromHolder?.nama || "Gudang/Umum"}</span>
                              <span className="text-zinc-400 text-[10px]">↓</span>
                              <span className="text-emerald-800 font-bold">{h.toHolder?.nama || "Gudang/Umum"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 font-normal">{h.fromDistribution?.nama || "-"}</span>
                              <span className="text-zinc-400 text-[10px]">↓</span>
                              <span className="text-emerald-800 font-bold">{h.toDistribution?.nama || "-"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 font-normal">{getKondisiText(h.fromCondition)}</span>
                              <span className="text-zinc-400 text-[10px]">↓</span>
                              <span className="text-emerald-800 font-bold">{getKondisiText(h.toCondition)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <div className="font-bold text-zinc-950">No: {h.beritaAcaraNumber}</div>
                            <div className="text-zinc-800 font-semibold">
                              Tgl: {new Date(h.beritaAcaraDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            {h.description && (
                              <div className="text-[10px] text-zinc-500 font-normal italic mt-1 max-w-[180px] break-words">
                                Ket: {h.description}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-zinc-800 whitespace-nowrap">
                            {h.creator.nama}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {h.documents && h.documents.length > 0 ? (
                              <a
                                href={h.documents[0].fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-800 hover:text-emerald-700 font-bold hover:underline text-xs flex items-center justify-end gap-1"
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
      )}

      {/* Riwayat Rekonsiliasi */}
      {reconHistory && reconHistory.length > 0 && (
        <Card className="border-zinc-200/80">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Riwayat Rekonsiliasi
            </CardTitle>
            <CardDescription className="text-zinc-800 font-medium">
              Hasil pemeriksaan rekonsiliasi aset dari setiap periode.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {reconHistory.map((r: any) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900">{r.period?.nama}</span>
                      <Badge
                        variant={r.status === "SESUAI" ? "success" : r.status === "TIDAK_SESUAI" ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {r.status === "SESUAI" ? "Sesuai" : r.status === "TIDAK_SESUAI" ? "Tidak Sesuai" : "Belum Direkon"}
                      </Badge>
                      {r._count?.findings > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold">{r._count.findings} temuan</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {r.checker && <span>Pemeriksa: {r.checker.nama}</span>}
                      {r.checkedAt && <span> · {formatDate(r.checkedAt)}</span>}
                      {r.notes && <span> · {r.notes}</span>}
                    </div>
                  </div>
                  <Link href={`/rekonsiliasi/pemeriksaan/${r.id}`}>
                    <Button variant="outline" size="sm" className="text-xs cursor-pointer">
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Lightbox / Fullscreen Image Preview */}
    {isLightboxOpen && activePhoto && (
      <div 
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-zoom-out"
        onClick={() => setIsLightboxOpen(false)}
      >
        <button 
          className="absolute top-4 right-4 text-white hover:text-zinc-350 font-bold text-xl bg-zinc-800/60 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => setIsLightboxOpen(false)}
        >
          ✕
        </button>
        <img 
          src={activePhoto} 
          alt="Preview ukuran penuh" 
          className="max-w-[95%] max-h-[90vh] object-contain rounded shadow-2xl"
        />
      </div>
    )}

    <ConfirmDialog
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={handleDeleteConfirmed}
      title="Hapus Aset Ini?"
      description={`Anda akan menghapus aset dengan kode "${asset.kodeLengkap}". Tindakan ini tidak dapat dibatalkan dan akan tercatat dalam log audit.`}
      confirmLabel="Ya, Hapus Aset"
      variant="danger"
    />
    </>
  );
}
