"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { 
  DoorClosed, 
  Plus, 
  Edit3, 
  Trash2, 
  Boxes, 
  UserCheck, 
  FileText, 
  Search, 
  Filter, 
  Loader2, 
  Building2,
  Eye,
  Layers
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createRoomAction, updateRoomAction, deleteRoomAction } from "@/actions/room";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";

const roomSchema = z.object({
  nama: z.string().min(1, "Nama ruangan wajib diisi"),
  kode: z.string().min(1, "Kode ruangan wajib diisi"),
  lantai: z.string().optional().or(z.literal("")),
  distributionId: z.string().min(1, "Bidang wajib dipilih"),
  pjHolderId: z.string().optional().or(z.literal("")),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RuanganClientProps {
  initialRooms: any[];
  distributions: any[];
  holders: any[];
  userRole: Role;
  opdName: string;
}

export function RuanganClient({
  initialRooms,
  distributions,
  holders,
  userRole,
  opdName,
}: RuanganClientProps) {
  const router = useRouter();
  const [rooms, setRooms] = React.useState(initialRooms);
  const [selectedBidang, setSelectedBidang] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "success" | "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
  });

  const triggerAlert = (title: string, description: string, variant: "success" | "danger" | "warning" | "info" = "info") => {
    setAlertDialog({ isOpen: true, title, description, variant });
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      nama: "",
      kode: "",
      lantai: "",
      distributionId: "",
      pjHolderId: "",
    },
  });

  const watchedDistributionId = watch("distributionId");

  // Filter holders based on selected distribution in the form
  const availablePjHolders = React.useMemo(() => {
    if (!watchedDistributionId) return holders;
    return holders.filter((h) => h.distributionId === watchedDistributionId);
  }, [holders, watchedDistributionId]);

  React.useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  // Filtered rooms list
  const filteredRooms = React.useMemo(() => {
    return rooms.filter((r) => {
      const matchBidang = selectedBidang === "ALL" || r.distribution.id === selectedBidang;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        r.nama.toLowerCase().includes(query) ||
        r.kode.toLowerCase().includes(query) ||
        (r.lantai && r.lantai.toLowerCase().includes(query)) ||
        (r.pjHolder && r.pjHolder.nama.toLowerCase().includes(query));
      return matchBidang && matchQuery;
    });
  }, [rooms, selectedBidang, searchQuery]);

  const totalAssetsInRooms = React.useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.assetCount || 0), 0);
  }, [rooms]);

  const roomsWithPjCount = React.useMemo(() => {
    return rooms.filter((r) => r.pjHolder).length;
  }, [rooms]);

  const handleOpenEdit = (room: any) => {
    if (userRole === Role.MANAGER) return;
    setSelectedRoom(room);
    setValue("nama", room.nama);
    setValue("kode", room.kode);
    setValue("lantai", room.lantai || "");
    setValue("distributionId", room.distribution.id);
    setValue("pjHolderId", room.pjHolder?.id || "");
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    if (userRole === Role.MANAGER) return;
    reset({
      nama: "",
      kode: "",
      lantai: "",
      distributionId: distributions[0]?.id || "",
      pjHolderId: "",
    });
    setIsCreateOpen(true);
  };

  const onCreateSubmit = async (values: RoomFormValues) => {
    if (userRole === Role.DEMO) {
      triggerAlert("Mode Demo", "Perubahan data dibatasi pada mode demo.", "warning");
      return;
    }
    if (userRole === Role.OPERATOR) {
      triggerAlert("Akses Terbatas", "Hanya Administrator yang berwenang mengelola master data ruangan.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRoomAction({
        nama: values.nama,
        kode: values.kode,
        lantai: values.lantai || null,
        distributionId: values.distributionId,
        pjHolderId: values.pjHolderId || null,
      });

      if (res.error) {
        triggerAlert("Gagal Menambahkan Ruangan", res.error, "danger");
      } else {
        triggerAlert("Berhasil", "Ruangan baru berhasil ditambahkan.", "success");
        setIsCreateOpen(false);
        reset();
        router.refresh();
      }
    } catch {
      triggerAlert("Kesalahan Sistem", "Terjadi kegagalan komunikasi saat menyimpan data ruangan.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (values: RoomFormValues) => {
    if (userRole === Role.DEMO) {
      triggerAlert("Mode Demo", "Perubahan data dibatasi pada mode demo.", "warning");
      return;
    }
    if (userRole === Role.OPERATOR) {
      triggerAlert("Akses Terbatas", "Hanya Administrator yang berwenang mengubah master data ruangan.", "warning");
      return;
    }

    if (!selectedRoom) return;

    setIsSubmitting(true);
    try {
      const res = await updateRoomAction(selectedRoom.id, {
        nama: values.nama,
        kode: values.kode,
        lantai: values.lantai || null,
        distributionId: values.distributionId,
        pjHolderId: values.pjHolderId || null,
      });

      if (res.error) {
        triggerAlert("Gagal Memperbarui", res.error, "danger");
      } else {
        triggerAlert("Berhasil", "Informasi ruangan berhasil diperbarui.", "success");
        setIsEditOpen(false);
        setSelectedRoom(null);
        router.refresh();
      }
    } catch {
      triggerAlert("Kesalahan Sistem", "Gagal memperbarui data ruangan.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (userRole === Role.DEMO) {
      triggerAlert("Mode Demo", "Penghapusan data dibatasi pada mode demo.", "warning");
      setDeleteTarget(null);
      return;
    }
    if (userRole === Role.OPERATOR) {
      triggerAlert("Akses Terbatas", "Hanya Administrator yang berwenang menghapus data ruangan.", "warning");
      setDeleteTarget(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await deleteRoomAction(deleteTarget.id);
      if (res.error) {
        triggerAlert("Gagal Menghapus Ruangan", res.error, "danger");
      } else {
        triggerAlert("Berhasil", `Ruangan "${deleteTarget.name}" berhasil dihapus.`, "success");
        router.refresh();
      }
    } catch {
      triggerAlert("Kesalahan Sistem", "Gagal menghapus ruangan.", "danger");
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const isReadOnly = userRole === Role.MANAGER || userRole === Role.OPERATOR || userRole === Role.DEMO;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DoorClosed className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Manajemen Ruangan & KIR
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Penataan inventaris barang per ruangan kerja di setiap bidang dan cetak Kartu Inventaris Ruangan (KIR).
          </p>
        </div>
        {!isReadOnly && (
          <Button
            onClick={handleOpenCreate}
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Ruangan
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-teal-700 dark:text-teal-300">
              Total Ruangan
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-teal-950 dark:text-teal-100 flex items-center justify-between">
              {rooms.length}
              <DoorClosed className="h-6 w-6 text-teal-600/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Terdaftar di {distributions.length} bidang kerja</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Aset Dalam Ruangan
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-950 dark:text-blue-100 flex items-center justify-between">
              {totalAssetsInRooms}
              <Boxes className="h-6 w-6 text-blue-600/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Unit barang teralokasi ke ruangan</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Ruangan Ber-PIC
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
              {roomsWithPjCount} / {rooms.length}
              <UserCheck className="h-6 w-6 text-emerald-600/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {rooms.length - roomsWithPjCount > 0
                ? `${rooms.length - roomsWithPjCount} ruangan belum memiliki PIC`
                : "Semua ruangan sudah memiliki PIC"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari nama ruangan, kode, atau PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-white dark:bg-zinc-800 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-xs text-zinc-500">Bidang:</span>
          <select
            value={selectedBidang}
            onChange={(e) => setSelectedBidang(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">Semua Bidang ({rooms.length})</option>
            {distributions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/75 dark:bg-zinc-800/50">
              <TableHead className="w-24 text-xs font-semibold">Kode</TableHead>
              <TableHead className="text-xs font-semibold">Nama Ruangan</TableHead>
              <TableHead className="text-xs font-semibold">Bidang / Unit Kerja</TableHead>
              <TableHead className="text-xs font-semibold">Lantai / Lokasi</TableHead>
              <TableHead className="text-xs font-semibold">Penanggung Jawab (PIC)</TableHead>
              <TableHead className="text-xs font-semibold text-center w-28">Jumlah Aset</TableHead>
              <TableHead className="text-xs font-semibold text-right w-44">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-500 text-sm">
                  Tidak ada data ruangan yang cocok dengan filter atau pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                  <TableCell className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {room.kode}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <DoorClosed className="h-4 w-4 text-zinc-400" />
                      {room.nama}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal bg-zinc-50 dark:bg-zinc-800">
                      <Building2 className="h-3 w-3 mr-1 text-zinc-500" />
                      {room.distribution.nama}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {room.lantai || "-"}
                  </TableCell>
                  <TableCell>
                    {room.pjHolder ? (
                      <div>
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {room.pjHolder.nama}
                        </div>
                        {room.pjHolder.nip && (
                          <div className="text-[11px] text-zinc-400 font-mono">
                            NIP: {room.pjHolder.nip}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                        Belum ditetapkan
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      <Boxes className="h-3 w-3" />
                      {room.assetCount || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/ruangan/${room.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-800"
                          title="Lihat Detail & Kartu Inventaris Ruangan (KIR)"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          KIR
                        </Button>
                      </Link>

                      {!isReadOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-900"
                            onClick={() => handleOpenEdit(room)}
                            title="Edit Ruangan"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => setDeleteTarget({ id: room.id, name: room.nama })}
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" />
            Tambah Ruangan Baru
          </DialogTitle>
          <DialogDescription>
            Daftarkan ruangan kerja baru di bawah bidang tertentu untuk pemilahan inventaris (KIR).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 py-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Bidang / Unit Kerja <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("distributionId")}
              className="mt-1 w-full h-9 px-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">-- Pilih Bidang --</option>
              {distributions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
            {errors.distributionId && (
              <p className="text-xs text-rose-500 mt-1">{errors.distributionId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Kode Ruangan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: R-01, R.APT.01"
                {...register("kode")}
                className="mt-1 h-9"
              />
              {errors.kode && (
                <p className="text-xs text-rose-500 mt-1">{errors.kode.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Lantai / Lokasi
              </label>
              <Input
                placeholder="Contoh: Lantai 2 Gedung A"
                {...register("lantai")}
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nama Ruangan <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Ruang Rapat Aptika, Ruang Server, Ruang Staf"
              {...register("nama")}
              className="mt-1 h-9"
            />
            {errors.nama && (
              <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Penanggung Jawab Ruangan (PIC)
            </label>
            <select
              {...register("pjHolderId")}
              className="mt-1 w-full h-9 px-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">-- Belum Ditetapkan / Kosong --</option>
              {availablePjHolders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nama} {h.nip ? `(${h.nip})` : ""} - {h.jabatan}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              Daftar disesuaikan dengan pegawai pemegang barang pada bidang terpilih.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Ruangan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-teal-600" />
            Edit Data Ruangan
          </DialogTitle>
          <DialogDescription>
            Perbarui nama, kode, lokasi, atau penanggung jawab ruangan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Bidang / Unit Kerja <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("distributionId")}
              className="mt-1 w-full h-9 px-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">-- Pilih Bidang --</option>
              {distributions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Kode Ruangan <span className="text-rose-500">*</span>
              </label>
              <Input {...register("kode")} className="mt-1 h-9" />
              {errors.kode && (
                <p className="text-xs text-rose-500 mt-1">{errors.kode.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Lantai / Lokasi
              </label>
              <Input {...register("lantai")} className="mt-1 h-9" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nama Ruangan <span className="text-rose-500">*</span>
            </label>
            <Input {...register("nama")} className="mt-1 h-9" />
            {errors.nama && (
              <p className="text-xs text-rose-500 mt-1">{errors.nama.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Penanggung Jawab Ruangan (PIC)
            </label>
            <select
              {...register("pjHolderId")}
              className="mt-1 w-full h-9 px-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">-- Belum Ditetapkan / Kosong --</option>
              {availablePjHolders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nama} {h.nip ? `(${h.nip})` : ""} - {h.jabatan}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Ruangan"
        description={`Apakah Anda yakin ingin menghapus ruangan "${deleteTarget?.name}"? Pastikan tidak ada aset yang tertaut pada ruangan ini.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* FEEDBACK ALERT DIALOG */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        variant={alertDialog.variant}
        onClose={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
