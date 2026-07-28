import { notFound } from "next/navigation";
import { getAssetById } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { Kondisi } from "@prisma/client";
import { ShieldCheck, MapPin, Tag, Briefcase, Camera, Box, AlertCircle } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Detail Aset Publik - AssetInventory",
  description: "Informasi detail aset melalui scan QR Code.",
};

const getKondisiLabel = (kondisi: Kondisi) => {
  switch (kondisi) {
    case Kondisi.NORMAL: return { label: "Normal", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case Kondisi.RUSAK_RINGAN: return { label: "Rusak Ringan", color: "bg-amber-100 text-amber-800 border-amber-200" };
    case Kondisi.RUSAK_BERAT: return { label: "Rusak Berat", color: "bg-rose-100 text-rose-800 border-rose-200" };
    case Kondisi.HILANG: return { label: "Hilang", color: "bg-zinc-100 text-zinc-800 border-zinc-200" };
    case Kondisi.DALAM_PERBAIKAN: return { label: "Dalam Perbaikan", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case Kondisi.DIPINJAM: return { label: "Dipinjam", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
    default: return { label: kondisi, color: "bg-gray-100 text-gray-800 border-gray-200" };
  }
};

interface ScanAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanAssetPage({ params }: ScanAssetPageProps) {
  const { id } = await params;

  try {
    const asset = await getAssetById(id);

    if (!asset) {
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full border border-zinc-200">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-zinc-900 mb-2">Aset Tidak Ditemukan</h1>
            <p className="text-sm text-zinc-500">QR Code yang Anda scan tidak valid atau aset telah dihapus dari sistem.</p>
          </div>
        </div>
      );
    }

    const kondisiBadge = getKondisiLabel(asset.kondisi);
    const fotoUrl = asset.fotoUtama ? DocumentService.generateFileUrl(asset.fotoUtama) : null;

    return (
      <div className="min-h-screen bg-zinc-50/50 pb-12">
        {/* Header Strip */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Verifikasi Aset</h1>
              <p className="text-emerald-100 text-xs font-medium">{asset.opd?.nama || "Pemerintah Daerah"}</p>
            </div>
          </div>
        </div>

        <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            {fotoUrl ? (
              <div className="w-full h-56 relative bg-zinc-100">
                <Image 
                  src={fotoUrl} 
                  alt={asset.namaAset}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-zinc-100 flex flex-col items-center justify-center text-zinc-400">
                <Camera className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-sm font-medium">Tidak ada foto</span>
              </div>
            )}
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">
                  {asset.namaAset}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex font-mono items-center px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {asset.kodeLengkap || "-"}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${kondisiBadge.color}`}>
                  {kondisiBadge.label}
                </span>
              </div>
              
              <p className="text-sm text-zinc-600 leading-relaxed">
                {asset.merkType ? `Merk/Type: ${asset.merkType}` : ""}
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Box className="h-4 w-4 text-emerald-600" /> 
              Informasi Detail
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-0.5">Kategori (KIB)</p>
                <p className="text-sm font-semibold text-zinc-900">{asset.category?.nama || "-"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Tahun Pembelian</p>
                  <p className="text-sm font-semibold text-zinc-900">{asset.tahunPembelian || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Nomor Register</p>
                  <p className="text-sm font-semibold text-zinc-900">{asset.nomorRegister || "-"}</p>
                </div>
              </div>

              {asset.spesifikasi && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Spesifikasi Tambahan</p>
                  <p className="text-sm font-semibold text-zinc-900 line-clamp-3">{asset.spesifikasi}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location & Holder Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Distribusi & Lokasi
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-emerald-100 p-1.5 rounded text-emerald-700">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Bidang / Sub-Unit</p>
                  <p className="text-sm font-semibold text-zinc-900">{asset.distribution?.nama || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-amber-100 p-1.5 rounded text-amber-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Pemegang Barang</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {asset.holder?.nama || "Gudang Umum / Belum Terdistribusi"}
                  </p>
                </div>
              </div>

              {asset.lokasi && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-sky-100 p-1.5 rounded text-sky-700">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-0.5">Detail Lokasi</p>
                    <p className="text-sm font-semibold text-zinc-900">{asset.lokasi}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-xs text-zinc-400 font-medium">
              Sistem Informasi Manajemen Barang Milik Daerah
              <br />
              {asset.opd?.nama || "Pemerintah Daerah"}
            </p>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Failed to load public asset detail page:", error);
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full border border-zinc-200">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-sm text-zinc-500">Gagal memuat data aset. Silakan coba beberapa saat lagi.</p>
        </div>
      </div>
    );
  }
}
