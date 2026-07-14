"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit3, Loader2, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { updateKibAction } from "@/actions/kib";

const kibSchema = z.object({
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  isActive: z.boolean(),
});

type KibFormValues = z.infer<typeof kibSchema>;

interface KibClientProps {
  initialKibs: any[];
}

export function KibClient({ initialKibs }: KibClientProps) {
  const router = useRouter();
  const [kibs, setKibs] = React.useState(initialKibs);
  const [selectedKib, setSelectedKib] = React.useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    setKibs(initialKibs);
  }, [initialKibs]);

  const form = useForm<KibFormValues>({
    resolver: zodResolver(kibSchema),
    defaultValues: {
      deskripsi: "",
      isActive: true,
    },
  });

  const handleEditClick = (kib: any) => {
    setSelectedKib(kib);
    form.reset({
      deskripsi: kib.deskripsi || "",
      isActive: kib.isActive,
    });
    setError(null);
    setSuccess(null);
    setIsEditOpen(true);
  };

  const onSubmit = async (values: KibFormValues) => {
    if (!selectedKib) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await updateKibAction(selectedKib.id, values);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setSuccess("Data KIB berhasil diperbarui.");
        setIsEditOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setError("Gagal menyimpan perubahan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Master KIB</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola master klasifikasi Kartu Inventaris Barang (KIB) A sampai F untuk Barang Milik Daerah.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-sm font-medium">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

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
                  <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">AKSI</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(kib)}
                        className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 rounded-full cursor-pointer"
                        title="Edit Deskripsi & Status"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <DialogHeader>
          <DialogTitle>Edit Master KIB {selectedKib?.kode}</DialogTitle>
          <DialogDescription>
            Ubah deskripsi penjelasan atau status keaktifan klasifikasi KIB {selectedKib?.nama}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs font-semibold">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Deskripsi
            </label>
            <textarea
              placeholder="Masukkan deskripsi penjelasan KIB..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...form.register("deskripsi")}
            />
            {form.formState.errors.deskripsi && (
              <p className="text-xs text-rose-500 font-medium">{form.formState.errors.deskripsi.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              {...form.register("isActive")}
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              KIB Berstatus Aktif
            </label>
          </div>

          <DialogFooter className="pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)} disabled={isSubmitting} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
