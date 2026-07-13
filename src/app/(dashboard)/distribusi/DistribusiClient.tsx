"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  GitFork, 
  Plus, 
  Edit3, 
  Trash2, 
  Boxes, 
  UserCheck, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createDistributionAction, updateDistributionAction, deleteDistributionAction } from "@/actions/distribution";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";

const distSchema = z.object({
  nama: z.string().min(1, "Nama bidang wajib diisi"),
});

type DistFormValues = z.infer<typeof distSchema>;

interface DistribusiClientProps {
  initialDistributions: any[];
  userRole: Role;
}

export function DistribusiClient({ initialDistributions, userRole }: DistribusiClientProps) {
  const router = useRouter();
  const [distributions, setDistributions] = React.useState(initialDistributions);
  const [error, setError] = React.useState<string | null>(null);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedDist, setSelectedDist] = React.useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DistFormValues>({
    resolver: zodResolver(distSchema),
    defaultValues: { nama: "" },
  });

  React.useEffect(() => {
    setDistributions(initialDistributions);
  }, [initialDistributions]);

  const handleOpenEdit = (dist: any) => {
    if (userRole === Role.MANAGER) return;
    setSelectedDist(dist);
    setValue("nama", dist.nama);
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    if (userRole === Role.MANAGER) return;
    reset();
    setIsCreateOpen(true);
  };

  const onCreateSubmit = async (values: DistFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createDistributionAction(values.nama);
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
      setError("Gagal membuat bidang distribusi.");
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (values: DistFormValues) => {
    if (!selectedDist) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateDistributionAction(selectedDist.id, values.nama);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setIsEditOpen(false);
        setSelectedDist(null);
        reset();
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      setError("Gagal memperbarui bidang distribusi.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (userRole === Role.MANAGER) return;
    if (confirm(`Apakah Anda yakin ingin menghapus bidang "${name}"? Hubungan data pemegang barang & aset yang terkait akan dinonaktifkan.`)) {
      try {
        const res = await deleteDistributionAction(id);
        if (res.error) {
          alert(res.error);
        } else if (res.success) {
          router.refresh();
        }
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus bidang.");
      }
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Bidang & Unit Kerja</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola struktur bidang penempatan inventaris aset OPD.
          </p>
        </div>
        {userRole !== Role.MANAGER && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
            <Plus className="h-4 w-4" />
            Tambah Bidang
          </Button>
        )}
      </div>

      {/* Grid displays */}
      {distributions.length === 0 ? (
        <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center text-zinc-500">
          <GitFork className="h-10 w-10 text-zinc-400 mb-3" />
          <p className="font-semibold">Belum Ada Bidang Terdaftar</p>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">Silakan tambahkan bidang kerja baru seperti Sekretariat, Keuangan, dsb.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {distributions.map((dist) => (
            <Card key={dist.id} className="border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <GitFork className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold truncate leading-tight">{dist.nama}</CardTitle>
                </div>
                {userRole !== Role.MANAGER && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(dist)}
                      className="h-8 w-8 text-zinc-500 hover:text-amber-500 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dist.id, dist.nama)}
                      className="h-8 w-8 text-zinc-500 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-400">Total Aset</span>
                      <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{dist._count.assets}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-400">Pemegang</span>
                      <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{dist._count.holders}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah Bidang Kerja</DialogTitle>
          <DialogDescription>Masukkan nama bidang atau unit kerja baru untuk OPD.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Bidang</label>
            <Input
              placeholder="Contoh: Bidang Informatika"
              {...register("nama")}
            />
            {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
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
          <DialogTitle>Sunting Bidang Kerja</DialogTitle>
          <DialogDescription>Ubah nama bidang atau unit kerja terpilih.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Bidang</label>
            <Input
              placeholder="Contoh: Bidang Informatika"
              {...register("nama")}
            />
            {errors.nama && <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>}
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
  );
}
