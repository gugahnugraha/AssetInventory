"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Printer, FileText, Check } from "lucide-react";
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from "@tanstack/react-table";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kondisi, Role } from "@prisma/client";
import { cn, formatRupiah } from "@/lib/utils";
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), { 
  ssr: false, 
  loading: () => <div className="p-8 text-center text-zinc-400 animate-pulse">Memuat Viewer PDF...</div> 
});
import { AssetBASTDocument } from "@/components/pdf/AssetBASTDocument";

interface PenghapusanClientProps {
  initialAssets: any[];
  userRole: Role;
  opdName?: string;
  holders?: any[];
}

export function PenghapusanClient({ initialAssets, userRole, opdName, holders = [] }: PenghapusanClientProps) {
  const [assets, setAssets] = React.useState(initialAssets);
  const [globalFilter, setGlobalFilter] = React.useState("");
  
  // Default to RUSAK_BERAT but allow ALL
  const [selectedKondisi, setSelectedKondisi] = React.useState<string>("RUSAK_BERAT");
  
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "kodeLengkap", desc: false }]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  
  const selectedCount = React.useMemo(() => {
    return Object.values(rowSelection).filter(Boolean).length;
  }, [rowSelection]);
  
  const [isFormFilled, setIsFormFilled] = React.useState(false);
  const [bastData, setBastData] = React.useState({
    tanggal: new Date().toISOString().split('T')[0],
    pihakPertamaId: "",
    pihakKeduaId: ""
  });

  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = React.useState(false);
  const [previewAssets, setPreviewAssets] = React.useState<any[]>([]);
  const [isPrintWarningOpen, setIsPrintWarningOpen] = React.useState(false);

  const getKondisiLabel = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL: return "Normal";
      case Kondisi.RUSAK_RINGAN: return "Rusak Ringan";
      case Kondisi.RUSAK_BERAT: return "Rusak Berat";
      case Kondisi.HILANG: return "Hilang";
      case Kondisi.DALAM_PERBAIKAN: return "Dalam Perbaikan";
      case Kondisi.DIPINJAM: return "Dipinjam";
      case Kondisi.SUDAH_DIHAPUS: return "Sudah Dihapus";
      default: return kondisi;
    }
  };

  const getKondisiBadgeVariant = (kondisi: Kondisi) => {
    switch (kondisi) {
      case Kondisi.NORMAL: return "success";
      case Kondisi.RUSAK_RINGAN:
      case Kondisi.DALAM_PERBAIKAN:
      case Kondisi.DIPINJAM: return "warning";
      case Kondisi.RUSAK_BERAT:
      case Kondisi.HILANG:
      case Kondisi.SUDAH_DIHAPUS: return "destructive";
      default: return "outline";
    }
  };

  const filteredData = React.useMemo(() => {
    return assets.filter(asset => {
      const matchKondisi = selectedKondisi === "ALL" || asset.kondisi === selectedKondisi;
      return matchKondisi;
    });
  }, [assets, selectedKondisi]);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            ref={(el) => {
              if (el) el.indeterminate = !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected();
            }}
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-background text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-background text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
        ),
      },
      {
        id: "index",
        header: "No.",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          const pageRows = table.getPaginationRowModel().rows;
          const posInPage = pageRows.findIndex((r) => r.id === row.id);
          return (
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {pageIndex * pageSize + posInPage + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "kodeLengkap",
        header: "Kode Aset",
        cell: ({ row }) => <span className="text-sm font-mono">{row.getValue("kodeLengkap")}</span>,
      },
      {
        accessorKey: "namaAset",
        header: "Nama Aset",
        cell: ({ row }) => <span className="font-semibold text-sm">{row.getValue("namaAset")}</span>,
      },
      {
        accessorKey: "merkType",
        header: "Merk / Type",
        cell: ({ row }) => <span className="text-sm">{row.original.merkType || "-"}</span>,
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
        header: "Unit/Bidang",
        cell: ({ row }) => <span className="text-sm">{row.original.distribution?.nama || "-"}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  const handlePrintBAST = () => {
    const selectedAssets = assets.filter(asset => rowSelection[asset.id] === true);
    if (selectedAssets.length === 0) {
      setIsPrintWarningOpen(true);
      return;
    }
    setPreviewAssets(selectedAssets);
    setIsPdfPreviewOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            Penghapusan Aset
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {isFormFilled 
              ? "Pilih aset untuk membuat Berita Acara Serah Terima (BAST) Penghapusan."
              : "Lengkapi data BAST sebelum memilih aset yang akan dihapuskan."}
          </p>
        </div>
        {isFormFilled && (
          <Button variant="outline" onClick={() => setIsFormFilled(false)} size="sm">
            Kembali ke Form
          </Button>
        )}
      </div>

      {!isFormFilled ? (
        <Card className="border-0 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Data Berita Acara Serah Terima (BAST)</CardTitle>
            <CardDescription>Masukkan tanggal BAST dan pihak yang bertanda tangan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal BAST</label>
                <Input
                  type="date"
                  value={bastData.tanggal}
                  onChange={e => setBastData(prev => ({ ...prev, tanggal: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pihak Pertama (Kepala Bidang)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={bastData.pihakPertamaId}
                  onChange={e => setBastData(prev => ({ ...prev, pihakPertamaId: e.target.value }))}
                >
                  <option value="">Pilih Kepala Bidang...</option>
                  {holders.map(holder => (
                    <option key={holder.id} value={holder.id}>
                      {holder.nama} - {holder.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pihak Kedua (Bendahara Barang)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={bastData.pihakKeduaId}
                  onChange={e => setBastData(prev => ({ ...prev, pihakKeduaId: e.target.value }))}
                >
                  <option value="">Pilih Bendahara Barang...</option>
                  {holders.map(holder => (
                    <option key={holder.id} value={holder.id}>
                      {holder.nama} - {holder.jabatan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={() => setIsFormFilled(true)}
                disabled={!bastData.tanggal || !bastData.pihakPertamaId || !bastData.pihakKeduaId}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Lanjutkan Pilih Aset
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>

      <Card className="border-0 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            <div className="relative w-full sm:w-72 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari nama aset, kode, atau merk..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-10 w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 transition-all rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedKondisi}
                onChange={e => setSelectedKondisi(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="RUSAK_BERAT">Rusak Berat</option>
                <option value="RUSAK_RINGAN">Rusak Ringan</option>
                <option value="HILANG">Hilang</option>
                <option value="NORMAL">Normal</option>
                <option value="SUDAH_DIHAPUS">Sudah Dihapus</option>
              </select>

              <Button 
                onClick={handlePrintBAST}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-4 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Cetak BAST
                {selectedCount > 0 && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
        <Table wrapperClassName="max-h-[500px] overflow-y-auto">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 py-3 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-zinc-500">
                  Tidak ada aset yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-sm text-zinc-500">
            Terpilih {selectedCount} dari {filteredData.length} aset.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>
        </>
      )}

      {isPrintWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-sm">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
              <FileText className="h-7 w-7 text-amber-500" />
            </div>
            <h3 className="font-bold">Belum Ada Aset Dipilih</h3>
            <p className="text-sm text-zinc-500 text-center">Centang minimal 1 aset pada tabel terlebih dahulu sebelum mencetak BAST.</p>
            <Button onClick={() => setIsPrintWarningOpen(false)} className="w-full" variant="outline">
              Mengerti
            </Button>
          </div>
        </div>
      )}

      {isPdfPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-white font-bold text-sm">Pratinjau BAST Penghapusan</p>
                <p className="text-zinc-400 text-xs">{previewAssets.length} aset terpilih</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsPdfPreviewOpen(false)} variant="outline" className="bg-transparent text-white border-zinc-700 hover:bg-zinc-800">
                Tutup
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-zinc-900">
            <PDFViewer width="100%" height="100%" className="border-0">
              <AssetBASTDocument 
                assets={previewAssets} 
                bastData={bastData}
                holders={holders}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}
