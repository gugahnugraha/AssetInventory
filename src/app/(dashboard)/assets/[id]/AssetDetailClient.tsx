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
  Star,
  Printer
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { deleteAssetAction, deleteAssetPhotoAction, setPrimaryPhotoAction } from "@/actions/asset";
import { Kondisi, Role, MutationType } from "@prisma/client";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), { ssr: false, loading: () => <div className="p-8 text-center text-zinc-400 animate-pulse">Memuat Viewer PDF...</div> });
import { AssetStickerDocument } from "@/components/pdf/AssetStickerDocument";

interface AssetDetailClientProps {
  asset: any;
  userRole: Role;
  reconHistory?: any[];
}

export function AssetDetailClient({ asset, userRole, reconHistory = [] }: AssetDetailClientProps) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = React.useState<string>(asset.fotoUtama || "/placeholder-asset.png");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "success" | "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
  });
  const triggerAlert = (title: string, description: string, variant: "success" | "danger" | "warning" | "info" = "info") => {
    setAlertDialog({ isOpen: true, title, description, variant });
  };
  const [activeTab, setActiveTab] = React.useState<"spec" | "history" | "audit" | "notes">("spec");
  const [isSubmittingPhoto, setIsSubmittingPhoto] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [sensusYear, setSensusYear] = React.useState(new Date().getFullYear().toString());
  const [labelSize, setLabelSize] = React.useState("60x40");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Printing states & logic
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [previewQrCodes, setPreviewQrCodes] = React.useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (isPrintModalOpen) {
      setIsPreviewLoading(true);
      import('qrcode').then((mod) => {
        const QRCode = mod.default;
        const generate = async () => {
          const codes: Record<string, string> = {};
          codes[asset.id] = await QRCode.toDataURL(
            `${window.location.origin}/assets/${asset.id}`,
            { margin: 1, width: 120 }
          );
          setPreviewQrCodes(codes);
          setIsPreviewLoading(false);
        };
        generate();
      });
    }
  }, [isPrintModalOpen, asset.id]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const { pdf } = await import('@react-pdf/renderer');
      const { AssetStickerDocument } = await import('@/components/pdf/AssetStickerDocument');

      const qrCodes: Record<string, string> = {};
      qrCodes[asset.id] = await QRCode.toDataURL(
        `${window.location.origin}/assets/${asset.id}`,
        { margin: 1, width: 120 }
      );
      
      const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : "";

      const pdfBlob = await pdf(
        <AssetStickerDocument assets={[asset]} qrCodes={qrCodes} logoUrl={logoUrl} isDemo={userRole === Role.DEMO} />
      ).toBlob();
      
      const blobWithMime = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blobWithMime);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Label_BMD_${asset.kodeLengkap || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      triggerAlert("Gagal", "Gagal menghasilkan PDF.", "danger");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const printParts = (asset.kodeLengkap || "").split(".");
  const printNoReg = printParts.pop() || "-";
  const printClassCode = printParts.join(".") || "-";
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : "";

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
    if (userRole === Role.DEMO) {
      triggerAlert("Demo Only", "Anda tidak diizinkan melakukan perubahan.", "warning");
      return;
    }
    setIsSubmittingPhoto(true);
    try {
      const res = await setPrimaryPhotoAction(asset.id, selectedDoc.id);
      if (res.success) {
        router.refresh();
      } else {
        triggerAlert("Gagal", res.error || "Gagal mengubah foto utama.", "danger");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedDoc || userRole === Role.MANAGER) return;
    if (userRole === Role.DEMO) {
      triggerAlert("Demo Only", "Anda tidak diizinkan melakukan perubahan.", "warning");
      return;
    }
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
        triggerAlert("Gagal", res.error || "Gagal menghapus foto.", "danger");
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
    if (userRole === Role.DEMO) {
      triggerAlert("Demo Only", "Anda tidak diizinkan melakukan perubahan.", "warning");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (userRole === Role.DEMO) {
      triggerAlert("Demo Only", "Anda tidak diizinkan melakukan perubahan.", "warning");
      return;
    }
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
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href="/assets" prefetch={false}>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-bold px-3 py-1">
                  KIB {asset.category?.kib?.kode || "B"}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-250 font-medium px-3 py-1">
                  {asset.category?.nama || "Peralatan"}
                </Badge>
                <Badge variant={getKondisiBadgeVariant(asset.kondisi)} className="shadow-sm">
                  {getKondisiLabel(asset.kondisi)}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{asset.namaAset}</h1>
              <p className="text-zinc-600 dark:text-zinc-400 font-mono text-sm sm:text-base bg-zinc-100 dark:bg-zinc-900 inline-block px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-inner w-fit">
                {asset.kodeLengkap}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all"
            >
              <Printer className="h-4 w-4" />
              Cetak Label
            </Button>

            {userRole !== Role.MANAGER && (
              <>
                <Link href={`/mutasi?assetId=${asset.id}`} prefetch={false}>
                  <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
                    <ArrowRightLeft className="h-4 w-4" />
                    Mutasi
                  </Button>
                </Link>
                <Link href={`/assets/${asset.id}/edit`} prefetch={false}>
                  <Button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
                    <Edit3 className="h-4 w-4" />
                    Sunting
                  </Button>
                </Link>
                <Button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm font-bold border border-rose-400/30 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("spec")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "spec"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Detail & Spesifikasi
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Riwayat Mutasi ({asset.history?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "audit"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Riwayat Perubahan (Audit)
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "notes"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }`}
        >
          Keterangan & Catatan
        </button>
      </div>

      {activeTab === "spec" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Photos & Placement (Left Column - 4 cols wide) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
              <div 
                className="relative aspect-4/3 bg-zinc-100/50 dark:bg-zinc-900/50 flex items-center justify-center border-b cursor-zoom-in group p-4"
                onClick={() => activePhoto && activePhoto !== "/placeholder-asset.png" && setIsLightboxOpen(true)}
              >
                {activePhoto && activePhoto !== "/placeholder-asset.png" ? (
                  <img
                    src={activePhoto}
                    alt={asset.namaAset}
                    className="w-full h-full object-cover rounded-md shadow-sm group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-400/80">
                    <div className="h-16 w-16 rounded-full bg-zinc-200/50 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <span className="text-xs font-medium">Belum ada dokumentasi</span>
                  </div>
                )}
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

          {/* Specifications & Details (Right column - 8 cols wide) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-md overflow-hidden">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b pb-4 pt-5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                  Identitas Spesifikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800/50">
                  <div className="p-5 space-y-4">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Merk / Type</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{asset.merkType || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Material / Bahan</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-300 text-sm">{asset.material || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Cara Perolehan</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-300 text-sm">{asset.caraPerolehan || "-"}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Harga Perolehan</span>
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">Rp {asset.harga ? asset.harga.toLocaleString("id-ID") : "0"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Tahun Pembelian</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-300 text-sm">{asset.tahunPembelian}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Kode Aset</span>
                        <span className="font-mono font-bold text-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm">
                          1.3.{String(asset.kode1).padStart(2, '0')}.{String(asset.kode2).padStart(2, '0')}.{String(asset.kode3).padStart(2, '0')}.{String(asset.kode4).padStart(2, '0')}.{String(asset.kode5).padStart(3, '0')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Register</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-sm">{asset.nomorRegister}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Full width row for Specs */}
                <div className="border-t border-zinc-100 dark:border-zinc-800/50 p-5 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Deskripsi Spesifikasi</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-300 leading-relaxed text-sm break-words max-w-[95%]">
                    {asset.spesifikasi || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Attributes Section */}
            {((asset.category?.attributes && asset.category.attributes.length > 0) || (asset.attributes && asset.attributes.length > 0)) && (
              <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-md overflow-hidden">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b pb-4 pt-5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                    Atribut Khusus Kategori ({asset.category?.nama || "Spesifikasi"})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800/50">
                    {asset.category?.attributes && asset.category.attributes.length > 0
                      ? asset.category.attributes.map((catAttr: any) => {
                          const valObj = asset.attributes?.find((a: any) => a.categoryAttributeId === catAttr.id || a.categoryAttribute?.nama === catAttr.nama);
                          return (
                            <div key={catAttr.id} className="p-4 space-y-1">
                              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">{catAttr.nama}</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px]">{valObj?.value || "-"}</span>
                            </div>
                          );
                        })
                      : asset.attributes.map((attr: any) => (
                          <div key={attr.id} className="p-4 space-y-1">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">{attr.categoryAttribute?.nama || "Atribut"}</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px]">{attr.value || "-"}</span>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : activeTab === "history" ? (
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
      ) : activeTab === "audit" ? (
        /* Tab Audit Trail */
        <Card className="border-zinc-200/80 dark:border-zinc-800/80">
          <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                Riwayat Perubahan Data (Audit Trail)
              </CardTitle>
              <CardDescription className="text-zinc-800 font-medium mt-1">
                Jejak rekam aktivitas penyuntingan pada spesifikasi dan atribut aset.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {asset.auditLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground italic">
                Belum ada riwayat perubahan data pada aset ini.
              </div>
            ) : (
              <div className="relative border-l border-zinc-250 dark:border-zinc-800 pl-4 space-y-6">
                {asset.auditLogs.map((log: any) => (
                  <div key={log.id} className="relative text-sm">
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
      ) : (
        /* Tab Keterangan & Catatan */
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b pb-3 pt-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-500 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
              Keterangan Tambahan & Catatan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-zinc-800 dark:text-zinc-300">
            {asset.catatan ? (
              <p className="whitespace-pre-wrap leading-relaxed font-medium bg-amber-50/30 p-4 rounded-lg border border-amber-100/50">{asset.catatan}</p>
            ) : (
              <p className="italic text-zinc-400 font-medium py-8 text-center">Tidak ada keterangan atau catatan tambahan yang dicatat untuk aset ini.</p>
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

    {/* ===== FULL-SCREEN PDF PREVIEW OVERLAY ===== */}
    {isPrintModalOpen && (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900/95 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-white font-bold text-sm">Pratinjau Cetak Label BMD</p>
              <p className="text-zinc-400 text-xs">Aset: {asset.namaAset}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-9 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              {isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
            </button>
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="h-9 px-4 rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 transition-colors text-sm active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Live PDF Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/50" style={{ minHeight: '65vh' }}>
          {isPreviewLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-emerald-500" />
              <p className="text-zinc-400 text-sm animate-pulse">Menyiapkan Preview Vektor...</p>
            </div>
          ) : isMobile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/80 border border-zinc-700 text-emerald-400">
                <Printer className="h-8 w-8" />
              </div>
              <div className="max-w-xs space-y-2">
                <p className="text-white font-bold text-base">Pratinjau PDF Tidak Didukung di HP</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Browser HP Anda tidak mendukung penayangan PDF secara langsung. Silakan unduh dokumen untuk melihat atau mencetak stiker.
                </p>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                {isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh PDF Label"}
              </button>
            </div>
          ) : (
            <PDFViewer width="100%" height="100%" className="border-0 bg-transparent flex-1" showToolbar={true}>
              <AssetStickerDocument
                assets={[asset]}
                qrCodes={previewQrCodes}
                logoUrl={typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : ""}
                isDemo={userRole === Role.DEMO}
                governmentName={asset.opd?.nama}
              />
            </PDFViewer>
          )}
        </div>
      </div>
    )}

    <AlertDialog
      isOpen={alertDialog.isOpen}
      onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      title={alertDialog.title}
      description={alertDialog.description}
      variant={alertDialog.variant}
    />
    </>
  );
}
