"use client";

import * as React from "react";
import Link from "next/link";
import {
  DoorClosed,
  ArrowLeft,
  Printer,
  Download,
  Boxes,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  QrCode
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";
import { formatRupiah } from "@/lib/utils";

interface RuanganDetailClientProps {
  room: any;
  userRole: Role;
  opdName: string;
}

export function RuanganDetailClient({
  room,
  userRole,
  opdName,
}: RuanganDetailClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const assets = room.assets || [];

  const crossBidangCount = React.useMemo(() => {
    return assets.filter(
      (a: any) => a.distribution && a.distribution.id !== room.distribution.id
    ).length;
  }, [assets, room.distribution.id]);

  const filteredAssets = React.useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(
      (a: any) =>
        a.namaAset.toLowerCase().includes(q) ||
        a.kodeLengkap.toLowerCase().includes(q) ||
        a.merkType.toLowerCase().includes(q) ||
        (a.holder?.nama && a.holder.nama.toLowerCase().includes(q))
    );
  }, [assets, searchQuery]);

  const totalValue = React.useMemo(() => {
    return assets.reduce((sum: number, a: any) => sum + (a.harga || 0), 0);
  }, [assets]);

  // Export to PDF
  const handlePrintKirPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { KirDocument } = await import("@/components/pdf/KirDocument");

      const doc = (
        <KirDocument
          room={room}
          opdName={opdName}
          isDemo={userRole === Role.DEMO}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `KIR_${room.kode.replace(/[^a-zA-Z0-9]/g, "_")}_${room.nama.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Failed to generate KIR PDF:", err);
      alert("Gagal membuat dokumen PDF Kartu Inventaris Ruangan.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = assets.map((a: any, idx: number) => {
      const isCrossBidang = a.distribution && a.distribution.id !== room.distribution.id;
      return {
        No: idx + 1,
        "Kode Barang": a.kodeLengkap,
        "Nama Barang": a.namaAset,
        "Merk / Tipe": a.merkType,
        Bahan: a.material || "-",
        "Tahun Perolehan": a.tahunPembelian,
        Harga: a.harga,
        Kondisi: a.kondisi,
        "Bidang Pemilik / Pencatat": a.distribution?.nama || room.distribution.nama,
        "Status Penempatan": isCrossBidang ? "Lintas Bidang" : "Sesuai Bidang",
        "Pemegang Barang": a.holder?.nama || "-",
        Keterangan: a.catatan || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KIR");
    XLSX.writeFile(
      workbook,
      `KIR_${room.kode.replace(/[^a-zA-Z0-9]/g, "_")}_${room.nama.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`
    );
  };

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Baik
          </span>
        );
      case "RUSAK_RINGAN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Rusak Ringan
          </span>
        );
      case "RUSAK_BERAT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            Rusak Berat
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-50 text-zinc-700 border border-zinc-200">
            {kondisi}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/ruangan"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Ruangan
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DoorClosed className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            {room.nama}
            <Badge variant="outline" className="font-mono text-xs ml-2 text-teal-700 border-teal-300">
              {room.kode}
            </Badge>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kartu Inventaris Ruangan (KIR) unit kerja {room.distribution.nama}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs h-9"
          >
            <Download className="h-4 w-4 mr-1.5 text-emerald-600" />
            Ekspor Excel
          </Button>

          <Button
            size="sm"
            onClick={handlePrintKirPdf}
            disabled={isGeneratingPdf}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 shadow-sm"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Menyiapkan PDF...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-1.5" />
                Cetak Lembar KIR (PDF)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Room Detail Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Bidang / Unit Kerja</CardDescription>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              {room.distribution.nama}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Kode Bidang: {room.distribution.kode}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Lokasi / Lantai</CardDescription>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              {room.lantai || "Tidak Dispesifikasikan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">{room.distribution.opd?.nama || opdName}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Penanggung Jawab (PIC)</CardDescription>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              {room.pjHolder?.nama || "Belum Ditentukan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {room.pjHolder?.nip ? `NIP: ${room.pjHolder.nip}` : room.pjHolder?.jabatan || "-"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-teal-700 dark:text-teal-300">
              Total Aset & Nilai
            </CardDescription>
            <CardTitle className="text-xl font-bold text-teal-950 dark:text-teal-100">
              {assets.length} Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              {formatRupiah(totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Daftar Barang Inventaris Ruangan ({assets.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72">
            <Search className="h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari aset dalam ruangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {crossBidangCount > 0 && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-200">
            <Building2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              Terdapat <strong>{crossBidangCount} aset</strong> yang tercatat secara administratif di bidang lain namun ditempatkan fisik di ruangan ini (penempatan lintas bidang).
            </span>
          </div>
        )}

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/75 dark:bg-zinc-800/50">
                <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
                <TableHead className="w-36 text-xs font-semibold">Kode Barang</TableHead>
                <TableHead className="text-xs font-semibold">Nama / Jenis Aset</TableHead>
                <TableHead className="text-xs font-semibold">Merk / Tipe</TableHead>
                <TableHead className="text-xs font-semibold">Kategori / KIB</TableHead>
                <TableHead className="text-xs font-semibold text-center w-20">Tahun</TableHead>
                <TableHead className="text-xs font-semibold text-right w-28">Harga</TableHead>
                <TableHead className="text-xs font-semibold text-center w-28">Kondisi</TableHead>
                <TableHead className="text-xs font-semibold w-36">Pemegang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-zinc-500 text-sm">
                    {assets.length === 0
                      ? "Belum ada aset yang dialokasikan ke ruangan ini. Alokasikan aset saat input aset baru atau melalui mutasi aset."
                      : "Tidak ada aset yang cocok dengan pencarian."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset: any, idx: number) => (
                  <TableRow key={asset.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <TableCell className="text-center text-xs text-zinc-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
                      {asset.kodeLengkap}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.namaAset}
                      </div>
                      {asset.material && (
                        <div className="text-[11px] text-zinc-400">
                          Bahan: {asset.material}
                        </div>
                      )}
                      {asset.distribution && asset.distribution.id !== room.distribution.id && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800">
                            Tercatat: {asset.distribution.nama}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {asset.merkType}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-zinc-800 dark:text-zinc-200">
                        {asset.category.nama}
                      </div>
                      {asset.category.kib && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">
                          KIB {asset.category.kib.kode}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs text-zinc-600 dark:text-zinc-400">
                      {asset.tahunPembelian}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(asset.harga)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getKondisiBadge(asset.kondisi)}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {asset.holder?.nama || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
