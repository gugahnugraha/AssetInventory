"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Clock,
  UserMinus,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { createUserAction, updateUserAction, deleteUserAction } from "@/actions/user";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// Create validation schema
const createUserSchema = z.object({
  nama: z.string().min(1, "Nama lengkap wajib diisi"),
  username: z.string().min(3, "Username minimal 3 karakter").toLowerCase().trim(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.nativeEnum(Role),
  isActive: z.boolean().default(true),
});

// Edit validation schema (password optional)
const editUserSchema = z.object({
  nama: z.string().min(1, "Nama lengkap wajib diisi"),
  username: z.string().min(3, "Username minimal 3 karakter").toLowerCase().trim(),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserClientProps {
  initialUsers: any[];
  currentUserId: string;
}

export function UserClient({ initialUsers, currentUserId }: UserClientProps) {
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [error, setError] = React.useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  // Create form Hook
  const createForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nama: "",
      username: "",
      password: "",
      role: Role.OPERATOR,
      isActive: true,
    },
  });

  // Edit form Hook
  const editForm = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nama: "",
      username: "",
      password: "",
      role: Role.OPERATOR,
      isActive: true,
    },
  });

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    editForm.setValue("nama", user.nama);
    editForm.setValue("username", user.username);
    editForm.setValue("password", "");
    editForm.setValue("role", user.role);
    editForm.setValue("isActive", user.isActive);
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    createForm.reset();
    setIsCreateOpen(true);
  };

  const onCreateSubmit = async (values: any) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createUserAction({
        nama: values.nama,
        username: values.username,
        passwordHash: values.password, // action will hash it
        role: values.role,
        isActive: values.isActive,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setIsCreateOpen(false);
        createForm.reset();
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      setError("Gagal menambahkan user baru.");
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (values: any) => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateUserAction(selectedUser.id, {
        nama: values.nama,
        username: values.username,
        password: values.password || undefined,
        role: values.role,
        isActive: values.isActive,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.success) {
        setIsEditOpen(false);
        setSelectedUser(null);
        editForm.reset();
        setIsSubmitting(false);
        router.refresh();
      }
    } catch (err) {
      setError("Gagal memperbarui data user.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUserId) {
      setError("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteUserAction(deleteTarget.id);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus user.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR:
        return "destructive";
      case Role.OPERATOR:
        return "default";
      case Role.MANAGER:
        return "info";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMINISTRATOR:
        return "Administrator";
      case Role.OPERATOR:
        return "Operator";
      case Role.MANAGER:
        return "Manager (Read Only)";
      default:
        return role;
    }
  };

  return (
    <>
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Kelola Pengguna</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Daftar akun pegawai OPD yang memiliki akses ke sistem inventaris.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Table list */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                <TableRow>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Nama & Username</TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Role Hak Akses</TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Status</TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Login Terakhir</TableHead>
                  <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            {user.nama}
                            {isSelf && <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500 text-emerald-600">Saya</Badge>}
                          </span>
                          <span className="text-xs text-zinc-500 mt-0.5">@{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit border-zinc-300 text-zinc-500">
                            <UserMinus className="h-3 w-3" />
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <span className="text-xs flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            {formatDate(user.lastLogin)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Belum pernah masuk</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 w-8 text-zinc-500 hover:text-amber-500 cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id, user.nama)}
                            disabled={isSelf}
                            className="h-8 w-8 text-zinc-500 hover:text-rose-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>Mendaftarkan akun operator atau manager baru untuk OPD ini.</DialogDescription>
        </DialogHeader>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
            <Input
              placeholder="Contoh: Asep Kurniawan"
              {...createForm.register("nama")}
            />
            {createForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{createForm.formState.errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Username</label>
            <Input
              placeholder="Contoh: asep.k"
              {...createForm.register("username")}
            />
            {createForm.formState.errors.username && <p className="text-xs text-rose-500 mt-1">{createForm.formState.errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Password (Min. 6 Karakter)</label>
            <Input
              type="password"
              placeholder="••••••••"
              {...createForm.register("password")}
            />
            {createForm.formState.errors.password && <p className="text-xs text-rose-500 mt-1">{createForm.formState.errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Hak Akses Role</label>
              <select
                {...createForm.register("role")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={Role.OPERATOR} className="bg-background text-foreground">Operator (CRUD Aset)</option>
                <option value={Role.MANAGER} className="bg-background text-foreground">Manager (Read-Only)</option>
                <option value={Role.ADMINISTRATOR} className="bg-background text-foreground">Administrator (Akses Penuh)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Status Akun</label>
              <select
                onChange={e => createForm.setValue("isActive", e.target.value === "true")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="true" className="bg-background text-foreground">Aktif</option>
                <option value="false" className="bg-background text-foreground">Nonaktif</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Akun"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <DialogHeader>
          <DialogTitle>Sunting Akun Pengguna</DialogTitle>
          <DialogDescription>Sunting profil hak akses atau nonaktifkan akun terpilih.</DialogDescription>
        </DialogHeader>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
            <Input
              placeholder="Contoh: Asep Kurniawan"
              {...editForm.register("nama")}
            />
            {editForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{editForm.formState.errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Username</label>
            <Input
              placeholder="Contoh: asep.k"
              {...editForm.register("username")}
            />
            {editForm.formState.errors.username && <p className="text-xs text-rose-500 mt-1">{editForm.formState.errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Ganti Password <span className="text-zinc-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...editForm.register("password")}
            />
            {editForm.formState.errors.password && <p className="text-xs text-rose-500 mt-1">{editForm.formState.errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Hak Akses Role</label>
              <select
                {...editForm.register("role")}
                disabled={selectedUser?.id === currentUserId}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value={Role.OPERATOR} className="bg-background text-foreground">Operator (CRUD Aset)</option>
                <option value={Role.MANAGER} className="bg-background text-foreground">Manager (Read-Only)</option>
                <option value={Role.ADMINISTRATOR} className="bg-background text-foreground">Administrator (Akses Penuh)</option>
              </select>
              {selectedUser?.id === currentUserId && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">Tidak dapat mengubah role sendiri</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Status Akun</label>
              <select
                value={editForm.watch("isActive") ? "true" : "false"}
                onChange={e => editForm.setValue("isActive", e.target.value === "true")}
                disabled={selectedUser?.id === currentUserId}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value="true" className="bg-background text-foreground">Aktif</option>
                <option value="false" className="bg-background text-foreground">Nonaktif</option>
              </select>
              {selectedUser?.id === currentUserId && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">Tidak dapat menonaktifkan diri sendiri</p>
              )}
            </div>
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
      title={`Hapus User "${deleteTarget?.name}"?`}
      description="Akun user ini akan dihapus secara permanen. Seluruh data log audit yang bersangkutan tetap akan dipertahankan."
      confirmLabel="Ya, Hapus User"
      variant="danger"
    />
    </>
  );
}
