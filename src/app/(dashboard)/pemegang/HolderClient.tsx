"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Boxes, 
  Loader2, 
  AlertTriangle,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { createHolderAction, updateHolderAction, deleteHolderAction } from "@/actions/holder";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";

const holderSchema = z.object({
  nama: z.string().min(1, "Nama pemegang wajib diisi"),
  nip: z.string().min(18, "NIP wajib 18 digit").max(18, "NIP wajib 18 digit"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  distributionId: z.string().min(1, "Bidang wajib dipilih"),
});

type HolderFormValues = z.infer<typeof holderSchema>;

interface HolderClientProps {
  initialHolders: any[];
  distributions: any[];
  userRole: Role;
}

export function HolderClient({ initialHolders, distributions, userRole }: HolderClientProps) {
  const router = useRouter();
  const [holders, setHolders] = React.useState(initialHolders);
  const [error, setError] = React.useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedHolder, setSelectedHolder] = React.useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HolderFormValues>({
    resolver: zodResolver(holderSchema),
    defaultValues: {
      nama: "",
      nip: "",
      jabatan: "",
      distributionId: "",
    },
  });

  React.useEffect(() => {
    setHolders(initialHolders);
  }, [initialHolders]);

  const handleOpenEdit = (holder: any) => {
    if (userRole === Role.MANAGER) return;
    setSelectedHolder(holder);
    setValue("nama", holder.nama);
    setValue("nip", holder.nip);
    setValue("jabatan", holder.jabatan);
    setValue("distributionId", holder.distributionId);
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    if (userRole === Role.MANAGER) return;
    reset();
    setIsCreateOpen(true);
  };

  const onCreateSubmit = async (values: HolderFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createHolderAction(values);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setIsCreateOpen(false);
        reset();
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      setError("Gagal membuat pemegang barang.");
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (values: HolderFormValues) => {
    if (!selectedHolder) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateHolderAction(selectedHolder.id, values);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setIsEditOpen(false);
        setSelectedHolder(null);
        reset();
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      setError("Gagal memperbarui pemegang barang.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (userRole === Role.MANAGER) return;
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteHolderAction(deleteTarget.id);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus pemegang barang.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Pemegang Barang (PJB)</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola daftar aparatur penanggung jawab pemegang barang inventaris.
          </p>
        </div>
        {userRole !== Role.MANAGER && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
            <Plus className="h-4 w-4" />
            Tambah Pemegang
          </Button>
        )}
      </div>

      {/* Table List */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <CardContent className="p-0">
          {holders.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 italic">
              Belum ada pemegang barang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">NIP & Nama</TableHead>
                    <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Jabatan</TableHead>
                    <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Bidang</TableHead>
                    <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Jumlah Aset Dipegang</TableHead>
                    {userRole !== Role.MANAGER && <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holders.map((holder) => (
                    <TableRow key={holder.id}>
                      <TableCell>
                        <div className="flex flex-col min-w-48">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{holder.nama}</span>
                          <span className="text-xs text-zinc-500 font-mono mt-0.5">NIP. {holder.nip}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{holder.jabatan}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {holder.distribution.nama}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                          <Boxes className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{holder._count.assets} Aset</span>
                        </div>
                      </TableCell>
                      {userRole !== Role.MANAGER && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(holder)}
                              className="h-8 w-8 text-zinc-500 hover:text-amber-500 cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(holder.id, holder.nama)}
                              className="h-8 w-8 text-zinc-500 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah Pemegang Barang</DialogTitle>
          <DialogDescription>Daftarkan penanggung jawab barang inventaris yang baru.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
            <Input
              placeholder="Contoh: H. Dadang, S.Kom., M.Si."
              {...register("nama")}
            />
            {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">NIP (18 Digit)</label>
            <Input
              placeholder="Contoh: 198203152008011003"
              maxLength={18}
              className="font-mono"
              {...register("nip")}
            />
            {errors.nip && <p className="text-xs text-rose-500 mt-1">{errors.nip.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Jabatan</label>
            <Input
              placeholder="Contoh: Kepala Bidang Aset"
              {...register("jabatan")}
            />
            {errors.jabatan && <p className="text-xs text-rose-500 mt-1">{errors.jabatan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Bidang Penempatan</label>
            <select
              {...register("distributionId")}
              className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" className="bg-background text-foreground">Pilih Bidang</option>
              {distributions.map(d => (
                <option key={d.id} value={d.id} className="bg-background text-foreground">{d.nama}</option>
              ))}
            </select>
            {errors.distributionId && <p className="text-xs text-rose-500 mt-1">{errors.distributionId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambahkan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <DialogHeader>
          <DialogTitle>Sunting Pemegang Barang</DialogTitle>
          <DialogDescription>Ubah detail informasi penanggung jawab barang inventaris.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
            <Input
              placeholder="Contoh: H. Dadang, S.Kom., M.Si."
              {...register("nama")}
            />
            {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">NIP (18 Digit)</label>
            <Input
              placeholder="Contoh: 198203152008011003"
              maxLength={18}
              className="font-mono"
              {...register("nip")}
            />
            {errors.nip && <p className="text-xs text-rose-500 mt-1">{errors.nip.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Jabatan</label>
            <Input
              placeholder="Contoh: Kepala Bidang Aset"
              {...register("jabatan")}
            />
            {errors.jabatan && <p className="text-xs text-rose-500 mt-1">{errors.jabatan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Bidang Penempatan</label>
            <select
              {...register("distributionId")}
              className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" className="bg-background text-foreground">Pilih Bidang</option>
              {distributions.map(d => (
                <option key={d.id} value={d.id} className="bg-background text-foreground">{d.nama}</option>
              ))}
            </select>
            {errors.distributionId && <p className="text-xs text-rose-500 mt-1">{errors.distributionId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>

    <ConfirmDialog
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDeleteConfirmed}
      title={`Hapus Pemegang "${deleteTarget?.name}"?`}
      description="Data pemegang barang ini akan dihapus. Hubungan pemegang dengan barang inventaris terkait akan dinonaktifkan."
      confirmLabel="Ya, Hapus"
      variant="danger"
    />
    </>
  );
}
