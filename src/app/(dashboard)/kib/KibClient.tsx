"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface KibClientProps {
  initialKibs: any[];
}

export function KibClient({ initialKibs }: KibClientProps) {
  const [kibs, setKibs] = React.useState(initialKibs);

  React.useEffect(() => {
    setKibs(initialKibs);
  }, [initialKibs]);


  return (
    <div className="space-y-6 pt-0 pb-8 -mt-6 max-w-5xl">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">Master KIB</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Kelola master klasifikasi Kartu Inventaris Barang (KIB) A sampai F untuk Barang Milik Daerah.
            </p>
          </div>
        </div>
      </div>


      <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] font-semibold text-zinc-700 dark:text-zinc-300">KODE KIB</TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">NAMA KLASIFIKASI</TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">DESKRIPSI</TableHead>
                  <TableHead className="text-center font-semibold text-zinc-700 dark:text-zinc-300">JUMLAH KATEGORI</TableHead>
                  <TableHead className="text-center font-semibold text-zinc-700 dark:text-zinc-300">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kibs.map((kib) => (
                  <TableRow key={kib.id}>
                    <TableCell>
                      <Badge className="font-mono font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md w-8 h-8 flex items-center justify-center p-0">
                        {kib.kode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">{kib.nama}</TableCell>
                    <TableCell className="max-w-xs text-sm text-zinc-500 truncate" title={kib.deskripsi}>
                      {kib.deskripsi || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold bg-zinc-50 text-zinc-600 border-zinc-200">
                        {kib._count?.categories || 0} Kategori
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {kib.isActive ? (
                        <Badge variant="success" className="text-[10px]">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Nonaktif</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
