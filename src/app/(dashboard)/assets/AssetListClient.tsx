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
  Printer,
  X
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import dynamic from 'next/dynamic';
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), { ssr: false, loading: () => <div className="p-8 text-center text-zinc-400 animate-pulse">Memuat Viewer PDF...</div> });
import { AssetStickerDocument } from "@/components/pdf/AssetStickerDocument";
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
  // Hide minor columns on small screens by default — user can still scroll horizontally
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; code: string } | null>(null);
  const [sensusYear, setSensusYear] = React.useState(new Date().getFullYear().toString());
  const [labelSize, setLabelSize] = React.useState("60x40");
  const [rowSelection, setRowSelection] = React.useState({});
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = React.useState(false);
  const [previewAssets, setPreviewAssets] = React.useState<any[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [previewQrCodes, setPreviewQrCodes] = React.useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [isPrintWarningOpen, setIsPrintWarningOpen] = React.useState(false);

  React.useEffect(() => {
    if (isPdfPreviewOpen && previewAssets.length > 0) {
      setIsPreviewLoading(true);
      import('qrcode').then((mod) => {
        const QRCode = mod.default;
        const generate = async () => {
          const codes: Record<string, string> = {};
          for (const asset of previewAssets) {
            codes[asset.id] = await QRCode.toDataURL(
              `${window.location.origin}/assets/${asset.id}`,
              { margin: 1, width: 120 }
            );
          }
          setPreviewQrCodes(codes);
          setIsPreviewLoading(false);
        };
        generate();
      });
    }
  }, [isPdfPreviewOpen, previewAssets]);

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
            <div className="flex justify-end gap-1">
              <Link href={`/assets/${asset.id}`} prefetch={false} title="Detail Aset">
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 active:scale-90 transition-transform">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              {userRole !== Role.MANAGER && (
                <>
                  <Link href={`/assets/${asset.id}/edit`} prefetch={false} title="Edit Aset">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 active:scale-90 transition-transform">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(asset.id, asset.kodeLengkap)}
                    title="Hapus Aset"
                    className="h-9 w-9 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 active:scale-90 transition-transform"
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
    initialState: {
      pagination: {
        pageSize: 50,
      },
      columnVisibility: {
        merkType: false,
        tahunPembelian: false,
      },
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

  const handleBulkPrint = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedAssets = selectedRows.map(row => row.original);
    if (selectedAssets.length === 0) return;
    setPreviewAssets(selectedAssets);
    setIsPdfPreviewOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (previewAssets.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const { pdf } = await import('@react-pdf/renderer');
      const { AssetStickerDocument } = await import('@/components/pdf/AssetStickerDocument');

      const qrCodes: Record<string, string> = {};
      for (const asset of previewAssets) {
        qrCodes[asset.id] = await QRCode.toDataURL(
          `${window.location.origin}/assets/${asset.id}`,
          { margin: 1, width: 120 }
        );
      }
      
      const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : "";

      const pdfBlob = await pdf(
        <AssetStickerDocument assets={previewAssets} qrCodes={qrCodes} logoUrl={logoUrl} />
      ).toBlob();
      
      const blobWithMime = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blobWithMime);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Label_BMD_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Gagal menghasilkan PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <>
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Data Aset</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Kelola, cari, saring, dan ekspor daftar aset inventaris.
          </p>
        </div>
      </div>

      {/* Filters card */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Cetak Label — always enabled */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (Object.keys(rowSelection).length === 0) {
                setIsPrintWarningOpen(true);
              } else {
                handleBulkPrint();
              }
            }}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500 text-sky-600 dark:text-sky-400 dark:border-sky-500 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-950/30 active:scale-95 font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4 transition-transform group-hover:scale-110" />
            Cetak Label
            {Object.keys(rowSelection).length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold animate-in fade-in zoom-in duration-150">
                {Object.keys(rowSelection).length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Export, Import, Tambah */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2">
          <button
            onClick={exportToExcel}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 active:scale-95 font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            Export
          </button>
          {userRole === Role.ADMINISTRATOR && (
            <button
              onClick={() => setIsImportOpen(true)}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 active:scale-95 font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer"
            >
              <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Import
            </button>
          )}
          {userRole !== Role.MANAGER && (
            <Link href="/assets/tambah" prefetch={false}>
              <button className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-transparent hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white hover:border-emerald-600 active:scale-95 font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                Tambah Aset
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Table block */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
        {/* Table wrapper */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-700">
                  {headerGroup.headers.map(header => {
                    const isActions = header.column.id === "actions";
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "font-semibold text-zinc-100 dark:text-zinc-100 whitespace-nowrap py-3 bg-zinc-800 dark:bg-zinc-900",
                          isActions && "sticky right-0 bg-zinc-800 dark:bg-zinc-900 border-l border-zinc-700 dark:border-zinc-700 shadow-[-6px_0_12px_rgba(0,0,0,0.15)] z-10 text-right"
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
                  <TableCell colSpan={columns.length} className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📭</span>
                      <span className="text-sm font-medium">Tidak ada data aset yang cocok.</span>
                      <span className="text-xs text-zinc-400">Coba ubah filter atau kata kunci pencarian.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-100",
                      idx % 2 === 0
                        ? "bg-white dark:bg-zinc-950"
                        : "bg-zinc-50/60 dark:bg-zinc-900/40",
                      "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                    )}
                  >
                    {row.getVisibleCells().map(cell => {
                      const isActions = cell.column.id === "actions";
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "whitespace-nowrap py-2.5",
                            isActions && cn(
                              "sticky right-0 border-l border-zinc-100 dark:border-zinc-800 shadow-[-6px_0_12px_rgba(0,0,0,0.04)]",
                              idx % 2 === 0
                                ? "bg-white dark:bg-zinc-950"
                                : "bg-zinc-50 dark:bg-zinc-900/60"
                            )
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/60 gap-2 flex-wrap">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Menampilkan <span className="font-bold text-zinc-700 dark:text-zinc-200">{table.getRowModel().rows.length}</span> dari <span className="font-bold text-zinc-700 dark:text-zinc-200">{filteredData.length}</span> aset
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 bg-transparent hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 active:scale-95 font-semibold text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Sebelumnya
            </button>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 bg-transparent hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 active:scale-95 font-semibold text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
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

    {/* ===== WARNING: No Asset Selected for Print ===== */}
    {isPrintWarningOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-150">
          {/* Icon */}
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <Printer className="h-7 w-7 text-amber-500" />
          </div>
          {/* Text */}
          <div className="text-center space-y-1.5">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Belum Ada Aset Dipilih</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Centang minimal <span className="font-semibold text-zinc-700 dark:text-zinc-200">1 aset</span> pada tabel terlebih dahulu sebelum mencetak label.
            </p>
          </div>
          {/* Action */}
          <button
            onClick={() => setIsPrintWarningOpen(false)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all duration-150 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Mengerti
          </button>
        </div>
      </div>
    )}

    {/* ===== FULL-SCREEN PDF PREVIEW OVERLAY ===== */}
    {isPdfPreviewOpen && (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900/95 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-white font-bold text-sm">Pratinjau Cetak Label BMD</p>
              <p className="text-zinc-400 text-xs">{previewAssets.length} aset · {Math.ceil(previewAssets.length / 14)} halaman A4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 cursor-pointer flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
            </Button>
            <Button
              onClick={() => setIsPdfPreviewOpen(false)}
              className="h-9 cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 transition-colors"
            >
              Tutup
            </Button>
          </div>
        </div>

        {/* Live PDF Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/50" style={{ minHeight: '65vh' }}>
          {isPreviewLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-emerald-500" />
              <p className="text-zinc-400 text-sm animate-pulse">Menyiapkan Preview Vektor...</p>
            </div>
          ) : (
            <PDFViewer width="100%" height="100%" className="border-0 bg-transparent flex-1" showToolbar={true}>
              <AssetStickerDocument
                assets={previewAssets}
                qrCodes={previewQrCodes}
                logoUrl={typeof window !== "undefined" ? `${window.location.origin}/uploads/logo.png` : ""}
              />
            </PDFViewer>
          )}
        </div>
      </div>
    )}
    </>
  );
}
