"use client";

import * as React from "react";
import Link from "next/link";
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
  Check
} from "lucide-react";
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

interface AssetListClientProps {
  initialAssets: any[];
  distributions: any[];
  userRole: Role;
}

export function AssetListClient({ initialAssets, distributions, userRole }: AssetListClientProps) {
  const [assets, setAssets] = React.useState(initialAssets);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedKondisi, setSelectedKondisi] = React.useState<string>("ALL");
  const [selectedBidang, setSelectedBidang] = React.useState<string>("ALL");
  const [selectedTahun, setSelectedTahun] = React.useState<string>("ALL");
  const [selectedReconStatus, setSelectedReconStatus] = React.useState<string>("ALL");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; code: string } | null>(null);

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

  // Custom filtering based on dropdowns
  const filteredData = React.useMemo(() => {
    return assets.filter(asset => {
      const matchKondisi = selectedKondisi === "ALL" || asset.kondisi === selectedKondisi;
      const matchBidang = selectedBidang === "ALL" || asset.distributionId === selectedBidang;
      const matchTahun = selectedTahun === "ALL" || String(asset.tahunPembelian) === selectedTahun;
      
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
      
      return matchKondisi && matchBidang && matchTahun && matchRecon;
    });
  }, [assets, selectedKondisi, selectedBidang, selectedTahun, selectedReconStatus]);

  // Define Columns
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
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
          <div className="flex flex-col min-w-40">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{row.getValue("namaAset")}</span>
            <span className="text-xs text-zinc-500 mb-1">{row.original.merkType || "-"}</span>
            <Badge variant="outline" className="text-[10px] w-fit bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 font-medium">
              {row.original.category?.nama || "Lainnya"}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "distribution.nama",
        id: "bidang",
        header: "Bidang / Unit",
        cell: ({ row }) => <span className="text-sm">{row.original.distribution?.nama || "-"}</span>,
      },
      {
        accessorKey: "holder.nama",
        id: "pemegang",
        header: "Pemegang Barang",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.holder?.nama || "-"}</span>,
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
        accessorKey: "tahunPembelian",
        header: "Tahun",
        cell: ({ row }) => <span className="text-sm">{row.getValue("tahunPembelian")}</span>,
      },
      {
        id: "statusRekon",
        header: "Status Rekon",
        cell: ({ row }) => {
          const recons = row.original.reconciliations || [];
          if (recons.length === 0) {
            return <Badge variant="outline" className="text-[10px] text-zinc-500">Belum Direkon</Badge>;
          }
          const sorted = [...recons].sort((a: any, b: any) => {
            return new Date(b.period.tanggalMulai).getTime() - new Date(a.period.tanggalMulai).getTime();
          });
          const status = sorted[0]?.status || "BELUM_DIREKON";
          if (status === "SESUAI") {
            return <Badge variant="success" className="text-[10px]">Sesuai</Badge>;
          }
          if (status === "TIDAK_SESUAI") {
            return <Badge variant="destructive" className="text-[10px]">Tidak Sesuai</Badge>;
          }
          return <Badge variant="outline" className="text-[10px] text-zinc-500">Belum Direkon</Badge>;
        }
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div className="flex justify-end gap-2">
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
    },
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
        "Kategori Aset": asset.category?.nama || "-",
        "Nama Aset": asset.namaAset,
        "Merk / Type": asset.merkType || "-",
        "Harga (Rp)": asset.harga || 0,
        "Tahun Pembelian": asset.tahunPembelian,
        "Kondisi": getKondisiLabel(asset.kondisi),
        "Bidang": asset.distribution?.nama || "-",
        "Pemegang Barang": asset.holder?.nama || "-",
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

  return (
    <>
    <div className="space-y-6 pt-2 pb-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Data Aset</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola, cari, saring, dan ekspor daftar aset inventaris.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 cursor-pointer">
            <Download className="h-4 w-4" />
            Ekspor Excel
          </Button>
          {userRole !== Role.MANAGER && (
            <Link href="/assets/tambah" prefetch={false}>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
                <Plus className="h-4 w-4" />
                Tambah Aset
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters card */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Input Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari kode, jenis, merk, pemegang..."
                value={globalFilter ?? ""}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
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

            {/* Filter Kondisi */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={selectedKondisi}
                onChange={e => setSelectedKondisi(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL" className="bg-background text-foreground">Semua Kondisi</option>
                <option value={Kondisi.NORMAL} className="bg-background text-foreground">Normal</option>
                <option value={Kondisi.RUSAK_RINGAN} className="bg-background text-foreground">Rusak Ringan</option>
                <option value={Kondisi.RUSAK_BERAT} className="bg-background text-foreground">Rusak Berat</option>
                <option value={Kondisi.HILANG} className="bg-background text-foreground">Hilang</option>
                <option value={Kondisi.DALAM_PERBAIKAN} className="bg-background text-foreground">Dalam Perbaikan</option>
                <option value={Kondisi.DIPINJAM} className="bg-background text-foreground">Dipinjam</option>
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

            {/* Filter Status Rekonsiliasi */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={selectedReconStatus}
                onChange={e => setSelectedReconStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL" className="bg-background text-foreground">Semua Rekonsiliasi</option>
                <option value="BELUM_DIREKON" className="bg-background text-foreground">Belum Direkon</option>
                <option value="SESUAI" className="bg-background text-foreground">Sesuai</option>
                <option value="TIDAK_SESUAI" className="bg-background text-foreground">Tidak Sesuai</option>
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
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
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
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
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
    </>
  );
}
