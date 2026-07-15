"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronDown,
  ArrowUpDown,
  Filter,
  Check,
  Upload,
  Printer
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { handlePrintSticker } from "./[id]/AssetDetailClient";
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState
} from "@tanstack/react-table";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deleteAssetAction } from "@/actions/asset";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Kondisi, Role } from "@prisma/client";
import * as XLSX from "xlsx";
import { cn, formatRupiah } from "@/lib/utils";
import { ImportDialog } from "@/components/ImportDialog";

interface AssetListClientProps {
  initialAssets: any[];
  distributions: any[];
  userRole: Role;
}

export function AssetListClient({ initialAssets, distributions, userRole }: AssetListClientProps) {
  const router = useRouter();
  const [assets, setAssets] = React.useState(initialAssets);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedKondisi, setSelectedKondisi] = React.useState<string>("ALL");
  const [selectedBidang, setSelectedBidang] = React.useState<string>("ALL");
  const [selectedTahun, setSelectedTahun] = React.useState<string>("ALL");
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedReconStatus, setSelectedReconStatus] = React.useState<string>("ALL");
  const [selectedKib, setSelectedKib] = React.useState<string>("ALL");
  const [selectedKategori, setSelectedKategori] = React.useState<string>("ALL");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; code: string } | null>(null);
  const [selectedAssetForPrint, setSelectedAssetForPrint] = React.useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [sensusYear, setSensusYear] = React.useState(new Date().getFullYear().toString());
  const [labelSize, setLabelSize] = React.useState("60x40");
  const [rowSelection, setRowSelection] = React.useState({});

  const getKondisiLabel = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL:
        return "Normal";
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

  const handleDelete = (id: string, code: string) => {
    if (userRole === Role.MANAGER) return;
    setDeleteTarget({ id, code });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteAssetAction(deleteTarget.id);
      if (res.success) {
        setAssets(assets.filter(a => a.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error("Delete asset error:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Compute unique sorted years from asset data
  const availableYears = React.useMemo(() => {
    const years = Array.from(new Set(assets.map(a => a.tahunPembelian).filter(Boolean))) as number[];
    return years.sort((a, b) => b - a);
  }, [assets]);

  // Compute unique sorted KIBs from asset data
  const availableKibs = React.useMemo(() => {
    const kibMap = new Map();
    assets.forEach(a => {
      const kib = a.category?.kib;
      if (kib) {
        kibMap.set(kib.id, kib);
      }
    });
    return Array.from(kibMap.values()).sort((a: any, b: any) => a.kode.localeCompare(b.kode)) as any[];
  }, [assets]);

  // Compute unique sorted Categories from asset data, optionally filtered by selected KIB
  const availableCategories = React.useMemo(() => {
    const catMap = new Map();
    assets.forEach(a => {
      const cat = a.category;
      if (cat) {
        if (selectedKib === "ALL" || cat.kibId === selectedKib) {
          catMap.set(cat.id, cat);
        }
      }
    });
    return Array.from(catMap.values()).sort((a: any, b: any) => a.nama.localeCompare(b.nama)) as any[];
  }, [assets, selectedKib]);

  // Reset selected category if KIB filter changes
  React.useEffect(() => {
    setSelectedKategori("ALL");
  }, [selectedKib]);

  // Custom filtering based on dropdowns
  const filteredData = React.useMemo(() => {
    return assets.filter(asset => {
      const matchKondisi = selectedKondisi === "ALL" || asset.kondisi === selectedKondisi;
      const matchBidang = selectedBidang === "ALL" || asset.distributionId === selectedBidang;
      const matchTahun = selectedTahun === "ALL" || String(asset.tahunPembelian) === selectedTahun;
      const matchKib = selectedKib === "ALL" || asset.category?.kibId === selectedKib;
      const matchKategori = selectedKategori === "ALL" || asset.categoryId === selectedKategori;
      
      let matchRecon = true;
      if (selectedReconStatus !== "ALL") {
        const recons = asset.reconciliations || [];
        if (recons.length === 0) {
          matchRecon = selectedReconStatus === "BELUM_DIREKON";
        } else {
          const sorted = [...recons].sort((a: any, b: any) => {
            return new Date(b.period.tanggalMulai).getTime() - new Date(a.period.tanggalMulai).getTime();
          });
          const latestStatus = sorted[0]?.status || "BELUM_DIREKON";
          matchRecon = latestStatus === selectedReconStatus;
        }
      }
      
      return matchKondisi && matchBidang && matchTahun && matchRecon && matchKib && matchKategori;
    });
  }, [assets, selectedKondisi, selectedBidang, selectedTahun, selectedReconStatus, selectedKib, selectedKategori]);

  // Define Columns
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-background text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-background text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        ),
      },
      {
        id: "index",
        header: "No.",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "kodeLengkap",
        header: ({ column }) => (
          <Button variant="ghost" className="p-0 font-semibold cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Kode Aset <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {row.getValue("kodeLengkap")}
          </span>
        ),
      },
      {
        accessorKey: "namaAset",
        header: ({ column }) => (
          <Button variant="ghost" className="p-0 font-semibold cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nama Aset <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{row.getValue("namaAset")}</span>
        ),
      },
      {
        id: "kategori",
        header: "Kategori",
        cell: ({ row }) => <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{row.original.category?.nama || "-"}</span>,
      },
      {
        accessorKey: "merkType",
        header: "Merk / Type",
        cell: ({ row }) => <span className="text-sm">{row.original.merkType || "-"}</span>,
      },
      {
        accessorKey: "harga",
        header: "Harga Perolehan",
        cell: ({ row }) => <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatRupiah(row.original.harga || 0)}</span>,
      },
      {
        accessorKey: "tahunPembelian",
        header: "Tahun",
        cell: ({ row }) => <span className="text-sm">{row.getValue("tahunPembelian")}</span>,
      },
      {
        accessorKey: "kondisi",
        header: "Kondisi",
        cell: ({ row }) => {
          const val = row.getValue("kondisi") as Kondisi;
          return <Badge variant={getKondisiBadgeVariant(val)}>{getKondisiLabel(val)}</Badge>;
        },
      },
      {
        id: "bidang_nama",
        accessorFn: (row) => row.distribution?.nama,
        header: "Bidang / Unit",
        cell: ({ row }) => <span className="text-sm">{row.original.distribution?.nama || "-"}</span>,
      },
      {
        id: "holder_nama",
        accessorFn: (row) => row.holder?.nama,
        header: "Pemegang Barang",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.holder?.nama || "Gudang / Umum"}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setSelectedAssetForPrint(asset);
                  setIsPrintModalOpen(true);
                }}
                title="Cetak Label" 
                className="h-8 w-8 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Link href={`/assets/${asset.id}`} prefetch={false} title="Detail Aset">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              {userRole !== Role.MANAGER && (
                <>
                  <Link href={`/assets/${asset.id}/edit`} prefetch={false} title="Edit Aset">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(asset.id, asset.kodeLengkap)}
                    title="Hapus Aset"
                    className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [assets, userRole]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const kode = String(row.getValue("kodeLengkap") || "").toLowerCase();
      const nama = String(row.original.namaAset || "").toLowerCase();
      const category = String(row.original.category?.nama || "").toLowerCase();
      const merk = String(row.original.merkType || "").toLowerCase();
      const bidang = String(row.original.distribution?.nama || "").toLowerCase();
      const pemegang = String(row.original.holder?.nama || "").toLowerCase();
      const tahun = String(row.getValue("tahunPembelian") || "");

      const matchAttribute = row.original.attributes?.some((attr: any) => {
        const attrName = String(attr.categoryAttribute?.nama || "").toLowerCase();
        const attrVal = String(attr.value || "").toLowerCase();
        return attrName.includes(search) || attrVal.includes(search);
      });

      return (
        kode.includes(search) ||
        nama.includes(search) ||
        category.includes(search) ||
        merk.includes(search) ||
        bidang.includes(search) ||
        pemegang.includes(search) ||
        tahun.includes(search) ||
        matchAttribute
      );
    },
  });

  const exportToExcel = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
      const asset = row.original;
      const baseData: any = {
        "Kode Aset": asset.kodeLengkap,
        "KIB": asset.category?.kib ? `KIB ${asset.category.kib.kode} - ${asset.category.kib.nama}` : "-",
        "Kategori Aset": asset.category?.nama || "-",
        "Nama Aset": asset.namaAset,
        "Merk / Type": asset.merkType || "-",
        "Harga (Rp)": asset.harga || 0,
        "Tahun Pembelian": asset.tahunPembelian,
        "Kondisi": getKondisiLabel(asset.kondisi),
        "Bidang": asset.distribution?.nama || "-",
        "Pemegang Barang": asset.holder?.nama || "Gudang / Umum",
        "Catatan": asset.catatan || "-",
      };

      // Add dynamic attributes dynamically
      asset.attributes?.forEach((attr: any) => {
        if (attr.categoryAttribute?.nama) {
          baseData[attr.categoryAttribute.nama] = attr.value || "-";
        }
      });

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Aset Inventaris");

    // Auto-fit column widths
    const maxLens = Object.keys(dataToExport[0] || {}).map((key) => {
      const lengths = dataToExport.map(row => String((row as any)[key] || "").length);
      return Math.max(key.length, ...lengths) + 3;
    });
    worksheet["!cols"] = maxLens.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `Aset_Inventaris_DISKOMINFO_${Date.now()}.xlsx`);
  };

  const handleBulkPrint = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedAssets = selectedRows.map(row => row.original);
    if (selectedAssets.length === 0) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const QRCode = (await import('qrcode')).default;

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      document.body.appendChild(container);

      const stickersPerPage = 12;
      let pagesHtml = "";

      for (let i = 0; i < selectedAssets.length; i += stickersPerPage) {
        const pageAssets = selectedAssets.slice(i, i + stickersPerPage);
        pagesHtml += `<div class="a4-page">`;
        for (const asset of pageAssets) {
          const qrDataUrl = await QRCode.toDataURL(
            `${window.location.origin}/assets/${asset.id}`, 
            { margin: 1, width: 150 }
          );
          
          const parts = (asset.kodeLengkap || "").split(".");
          const noReg = parts.pop() || "-";
          const classCode = parts.join(".") || "-";
          
          const opdKode = asset.opd?.kodeNumeric || "-";
          const opdNama = asset.opd?.kode || "-";
          const namaAset = asset.namaAset || "-";
          const tahunBeli = asset.tahunPembelian || "-";
          const logoUrl = `${window.location.origin}/uploads/logo.png`;

          pagesHtml += `
            <div class="sticker">
              <div class="sticker-header">PEMERINTAH KABUPATEN BANDUNG</div>
              <div class="sticker-body">
                <div class="logo-box">
                  <img src="${logoUrl}" alt="Logo" />
                </div>
                <div class="details-box">
                  <table>
                    <colgroup>
                      <col style="width: 14mm;" />
                      <col style="width: 2mm;" />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td>KODE ASET</td>
                        <td style="text-align:center;">:</td>
                        <td style="white-space:normal; word-wrap:break-word;">${classCode}</td>
                      </tr>
                      <tr>
                        <td>NAMA ASET</td>
                        <td style="text-align:center;">:</td>
                        <td style="white-space:normal; word-wrap:break-word;">${namaAset}</td>
                      </tr>
                      <tr>
                        <td>TAHUN</td>
                        <td style="text-align:center;">:</td>
                        <td>${tahunBeli}</td>
                      </tr>
                      <tr>
                        <td>KODE SKPD</td>
                        <td style="text-align:center;">:</td>
                        <td style="white-space:normal; word-wrap:break-word;">${opdKode}</td>
                      </tr>
                      <tr>
                        <td>NAMA SKPD</td>
                        <td style="text-align:center;">:</td>
                        <td style="white-space:normal; word-wrap:break-word;">${opdNama}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="qr-box">
                  <div class="reg-text">REG: <strong>${noReg}</strong></div>
                  <img class="qr-code" src="${qrDataUrl}" alt="QR" />
                </div>
              </div>
            </div>
          `;
        }
        pagesHtml += `</div>`;
      }

      container.innerHTML = `
        <style>
          .pdf-wrapper {
            background-color: #fff;
            color: #000;
            font-family: Arial, sans-serif;
          }
          .a4-page {
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
            padding: 12mm 8mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(6, 1fr);
            justify-items: center;
            align-items: center;
            background-color: #fff;
            overflow: hidden;
            page-break-after: always;
          }
          .a4-page:last-child {
            page-break-after: avoid;
          }
          .sticker {
            border: 1px solid #000;
            box-sizing: border-box;
            padding: 1.5mm 2.5mm;
            display: flex;
            flex-direction: column;
            height: 42mm;
            width: 92mm;
            overflow: hidden;
          }
          .sticker-header {
            font-weight: bold;
            font-size: 6.5pt;
            text-align: center;
            text-decoration: underline;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
            letter-spacing: 0.1px;
          }
          .sticker-body {
            display: flex;
            flex: 1;
            align-items: center;
            gap: 2mm;
          }
          .logo-box {
            width: 24mm;
            height: 28mm;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
          }
          .logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .details-box {
            flex: 1;
            font-size: 4.2pt;
            font-weight: bold;
            line-height: 1.1;
          }
          .details-box table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .details-box td {
            padding: 0.5px 0;
            vertical-align: top;
          }
          .qr-box {
            width: 15mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            flex-shrink: 0;
          }
          .reg-text {
            font-size: 5.5pt;
            margin-bottom: 0.5mm;
            text-align: center;
            font-weight: bold;
          }
          .qr-code {
            width: 12mm;
            height: 12mm;
            object-fit: contain;
          }
        </style>
        <div id="pdf-content" class="pdf-wrapper">
          ${pagesHtml}
        </div>
      `;

      const element = container.querySelector("#pdf-content");
      
      const opt = {
        margin: 0,
        filename: `Label_Sensus_Massal_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      
      document.body.removeChild(container);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Gagal menghasilkan PDF.");
    }
  };

  return (
    <>
    <div className="space-y-6 pt-0 pb-8 -mt-6">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">Data Aset</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Kelola, cari, saring, dan ekspor daftar aset inventaris.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {Object.keys(rowSelection).length > 0 && (
              <Button 
                onClick={handleBulkPrint} 
                className="flex items-center gap-2 bg-sky-650 hover:bg-sky-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all animate-in fade-in zoom-in duration-200"
              >
                <Printer className="h-4 w-4" />
                Cetak Label Terpilih ({Object.keys(rowSelection).length})
              </Button>
            )}
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 cursor-pointer shadow-sm">
              <Download className="h-4 w-4" />
              Ekspor Excel
            </Button>
            {userRole !== Role.MANAGER && (
              <>
                <Button onClick={() => setIsImportOpen(true)} variant="outline" className="flex items-center gap-2 border-emerald-600/30 hover:border-emerald-650 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 cursor-pointer shadow-sm">
                  <Upload className="h-4 w-4" />
                  Import Excel
                </Button>
                <Link href="/assets/tambah" prefetch={false}>
                  <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm font-bold border-0 transition-all">
                    <Plus className="h-4 w-4" />
                    Tambah Aset
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters card */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Input Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari kode, jenis, merk, pemegang..."
                value={globalFilter ?? ""}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={selectedKategori}
                onChange={e => setSelectedKategori(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL" className="bg-background text-foreground">Semua Kategori</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Bidang */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={selectedBidang}
                onChange={e => setSelectedBidang(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL" className="bg-background text-foreground">Semua Bidang</option>
                {distributions.map(dist => (
                  <option key={dist.id} value={dist.id} className="bg-background text-foreground">{dist.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={selectedTahun}
                onChange={e => setSelectedTahun(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL" className="bg-background text-foreground">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={String(year)} className="bg-background text-foreground">{year}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table block */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map(header => {
                      const isActions = header.column.id === "actions";
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap",
                            isActions && "sticky right-0 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-zinc-500">
                      Tidak ada data aset yang cocok dengan filter atau pencarian Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => {
                        const isActions = cell.column.id === "actions";
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "whitespace-nowrap",
                              isActions && "sticky right-0 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-[-6px_0_12px_rgba(0,0,0,0.03)]"
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t gap-2 flex-wrap">
            <div className="text-xs text-zinc-500">
              Menampilkan {table.getRowModel().rows.length} dari {filteredData.length} data aset
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="cursor-pointer"
              >
                Sebelumnya
              </Button>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="cursor-pointer"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <ConfirmDialog
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDeleteConfirmed}
      title="Hapus Aset?"
      description={`Anda akan menghapus aset dengan kode "${deleteTarget?.code}". Tindakan ini akan dicatat di log audit dan tidak dapat dibatalkan.`}
      confirmLabel="Ya, Hapus Aset"
      variant="danger"
    />

    <ImportDialog
      isOpen={isImportOpen}
      onClose={() => setIsImportOpen(false)}
      distributions={distributions}
      onSuccess={() => {
        router.refresh();
      }}
    />

    {selectedAssetForPrint && (() => {
      const parts = (selectedAssetForPrint.kodeLengkap || "").split(".");
      const noReg = parts.pop() || "-";
      const classCode = parts.join(".") || "-";
      const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : "";

      return (
        <Dialog isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <Printer className="h-5 w-5" /> Pratinjau Label Stiker BMD
            </DialogTitle>
            <DialogDescription>
              Pratinjau label stiker Sensus BMD Kabupaten Bandung.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-zinc-900">
            {/* Mockup Stiker Preview Box */}
            <div className="flex justify-center p-6 bg-zinc-105 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <div className="w-[92mm] h-[42mm] scale-90 origin-center bg-white border border-zinc-950 p-[1.5mm_2.5mm] flex flex-col text-zinc-950 select-none shadow-md">
                <div className="text-[6.5pt] font-black text-center underline uppercase mb-[1.5mm]">
                  PEMERINTAH KABUPATEN BANDUNG
                </div>
                <div className="flex flex-1 items-center gap-[2mm]">
                  {/* Left logo box */}
                  <div className="w-[24mm] h-[28mm] flex-shrink-0 flex justify-center items-center">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  {/* Middle details table */}
                  <div className="flex-1 text-[4.2pt] font-bold leading-[1.1] text-left">
                    <table className="w-full border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[14mm]" />
                        <col className="w-[2mm]" />
                        <col />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td className="py-[0.5px] align-top">KODE ASET</td>
                          <td className="py-[0.5px] align-top text-center">:</td>
                          <td className="py-[0.5px] align-top break-words whitespace-normal">{classCode}</td>
                        </tr>
                        <tr>
                          <td className="py-[0.5px] align-top">NAMA ASET</td>
                          <td className="py-[0.5px] align-top text-center">:</td>
                          <td className="py-[0.5px] align-top break-words whitespace-normal">{selectedAssetForPrint.namaAset || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-[0.5px] align-top">TAHUN</td>
                          <td className="py-[0.5px] align-top text-center">:</td>
                          <td className="py-[0.5px] align-top">{selectedAssetForPrint.tahunPembelian || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-[0.5px] align-top">KODE SKPD</td>
                          <td className="py-[0.5px] align-top text-center">:</td>
                          <td className="py-[0.5px] align-top break-words whitespace-normal">{selectedAssetForPrint.opd?.kodeNumeric || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-[0.5px] align-top">NAMA SKPD</td>
                          <td className="py-[0.5px] align-top text-center">:</td>
                          <td className="py-[0.5px] align-top break-words whitespace-normal">{selectedAssetForPrint.opd?.kode || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Right QR box */}
                  <div className="w-[15mm] flex-shrink-0 flex flex-col items-center justify-center ml-auto">
                    <div className="text-[5.5pt] font-black mb-[0.5mm] text-center">
                      REG: {noReg}
                    </div>
                    <div className="w-[12mm] h-[12mm] bg-zinc-50 border border-zinc-200 flex items-center justify-center p-0.5">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                          typeof window !== "undefined" ? `${window.location.origin}/assets/${selectedAssetForPrint.id}` : ""
                        )}`} 
                        alt="QR" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)} className="h-9 cursor-pointer">
              Tutup
            </Button>
            <Button 
              onClick={() => {
                handlePrintSticker(selectedAssetForPrint);
                setIsPrintModalOpen(false);
              }} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 cursor-pointer"
            >
              Cetak Sekarang
            </Button>
          </DialogFooter>
        </Dialog>
      );
    })()}
    </>
  );
}
