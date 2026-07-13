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
  ImageIcon
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteAssetAction } from "@/actions/asset";
import { Kondisi, Role } from "@prisma/client";
import { useRouter } from "next/navigation";

interface AssetDetailClientProps {
  asset: any;
  userRole: Role;
}

export function AssetDetailClient({ asset, userRole }: AssetDetailClientProps) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = React.useState<string>(asset.fotoUtama || "/placeholder-asset.png");

  // Sync active photo if asset changes or uploads complete
  React.useEffect(() => {
    if (asset.fotoUtama) {
      setActivePhoto(asset.fotoUtama);
    }
  }, [asset.fotoUtama]);

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

  const handleDelete = async () => {
    if (userRole === Role.MANAGER) return;

    if (confirm(`Apakah Anda yakin ingin menghapus aset dengan kode ${asset.kodeLengkap}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        const res = await deleteAssetAction(asset.id);
        if (res.error) {
          alert(res.error);
        } else if (res.success) {
          router.push("/assets");
          router.refresh();
        }
      } catch (err) {
        console.error("Delete asset detail error:", err);
        alert("Gagal menghapus aset.");
      }
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
    <div className="space-y-6 pt-2 pb-8">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/assets">
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
            <Link href={`/assets/${asset.id}/edit`}>
              <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-xs">
                <Edit3 className="h-4 w-4" />
                Sunting Aset
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Aset
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photos Gallery (Left column) */}
        <div className="space-y-4">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
            <div className="relative aspect-4/3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-b">
              {activePhoto && activePhoto !== "/placeholder-asset.png" ? (
                <img
                  src={activePhoto}
                  alt={asset.jenisAset}
                  className="w-full h-full object-cover"
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
            
            {/* Small thumbnails row */}
            {asset.photos.length > 0 && (
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
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{asset.distribution.nama}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">Pemegang Barang (PJB)</p>
                  {asset.holder ? (
                    <div className="mt-0.5 space-y-0.5">
                      <p className="text-zinc-950 dark:text-zinc-50 font-medium">{asset.holder.nama}</p>
                      <p className="text-xs text-zinc-500">NIP. {asset.holder.nip}</p>
                      <p className="text-xs text-zinc-500">{asset.holder.jabatan}</p>
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
                <span className="text-zinc-500 font-medium">Jenis / Nama Aset</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{asset.jenisAset}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500 font-medium">Merk / Type</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{asset.merkType || "-"}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500 font-medium">Tahun Pembelian</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{asset.tahunPembelian}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500 font-medium">Nomor Register</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{asset.nomorRegister}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500 font-medium">Kode Bidang (Kelompok)</span>
                <span className="font-mono">01.03.{asset.kode1}.{asset.kode2}.{asset.kode3}.{asset.kode4}</span>
              </div>
            </CardContent>
          </Card>

          {/* Catatan Card */}
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Keterangan & Catatan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-zinc-700 dark:text-zinc-300">
              {asset.catatan ? (
                <p className="whitespace-pre-wrap leading-relaxed">{asset.catatan}</p>
              ) : (
                <p className="italic text-zinc-500">Tidak ada catatan tambahan untuk aset ini.</p>
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
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-500">
                Audit Trail
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {asset.auditLogs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground italic">
                  Belum ada riwayat perubahan data.
                </div>
              ) : (
                <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-6">
                  {asset.auditLogs.map((log: any) => (
                    <div key={log.id} className="relative text-sm">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border border-white dark:border-zinc-950 shadow-xs" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.user.nama}</span>
                          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-normal text-xs pt-0.5">
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
    </div>
  );
}
