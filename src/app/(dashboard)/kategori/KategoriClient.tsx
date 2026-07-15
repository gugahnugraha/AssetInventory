"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Check,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  createCategoryAction, 
  updateCategoryAction, 
  deleteCategoryAction,
  createCategoryAttributeAction,
  updateCategoryAttributeAction,
  deleteCategoryAttributeAction
} from "@/actions/category";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// VALIDATION SCHEMAS
const categorySchema = z.object({
  nama: z.string().min(1, "Nama kategori wajib diisi"),
  kibId: z.string().min(1, "Harap pilih KIB"),
});

const attributeSchema = z.object({
  nama: z.string().min(1, "Nama atribut wajib diisi"),
  required: z.boolean(),
  fieldType: z.string(),
  displayOrder: z.coerce.number(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type AttributeFormValues = z.infer<typeof attributeSchema>;

interface KategoriClientProps {
  initialCategories: any[];
  kibs: { id: string; kode: string; nama: string }[];
}

export function KategoriClient({ initialCategories, kibs }: KategoriClientProps) {
  const router = useRouter();
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedCatId, setSelectedCatId] = React.useState<string | null>(null);

  // Modal states
  const [isCatCreateOpen, setIsCatCreateOpen] = React.useState(false);
  const [isCatEditOpen, setIsCatEditOpen] = React.useState(false);
  const [selectedCat, setSelectedCat] = React.useState<any>(null);

  const [isAttrCreateOpen, setIsAttrCreateOpen] = React.useState(false);
  const [isAttrEditOpen, setIsAttrEditOpen] = React.useState(false);
  const [selectedAttr, setSelectedAttr] = React.useState<any>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = React.useState<any | null>(null);
  const [deleteAttrTarget, setDeleteAttrTarget] = React.useState<any | null>(null);

  React.useEffect(() => {
    setCategories(initialCategories);
    if (initialCategories.length > 0 && !selectedCatId) {
      setSelectedCatId(initialCategories[0].id);
    }
  }, [initialCategories, selectedCatId]);

  const selectedCategory = React.useMemo(() => {
    return categories.find(c => c.id === selectedCatId) || null;
  }, [categories, selectedCatId]);

  // Forms hook-form
  const catForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { nama: "", kibId: "" },
  });

  const attrForm = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema) as any,
    defaultValues: {
      nama: "",
      required: false,
      fieldType: "TEXT",
      displayOrder: 0,
    },
  });

  // CATEGORY HANDLERS

  const handleOpenCatCreate = () => {
    catForm.reset({ nama: "", kibId: "" });
    setError(null);
    setIsCatCreateOpen(true);
  };

  const handleOpenCatEdit = (cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCat(cat);
    catForm.reset({
      nama: cat.nama,
      kibId: cat.kibId || "",
    });
    setError(null);
    setIsCatEditOpen(true);
  };

  const onCatCreateSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createCategoryAction(values.nama, values.kibId);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setIsCatCreateOpen(false);
        catForm.reset();
        router.refresh();
      }
    } catch (err) {
      setError("Gagal membuat kategori baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCatEditSubmit = async (values: CategoryFormValues) => {
    if (!selectedCat) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateCategoryAction(selectedCat.id, values.nama, values.kibId);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setIsCatEditOpen(false);
        setSelectedCat(null);
        catForm.reset();
        router.refresh();
      }
    } catch (err) {
      setError("Gagal memperbarui kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCatDelete = (cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCatTarget(cat);
  };

  const handleCatDeleteConfirmed = async () => {
    if (!deleteCatTarget) return;
    try {
      const res = await deleteCategoryAction(deleteCatTarget.id);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        if (selectedCatId === deleteCatTarget.id) {
          setSelectedCatId(null);
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus kategori.");
    } finally {
      setDeleteCatTarget(null);
    }
  };

  // ATTRIBUTE HANDLERS

  const handleOpenAttrCreate = () => {
    if (!selectedCatId) return;
    attrForm.reset({
      nama: "",
      required: false,
      fieldType: "TEXT",
      displayOrder: (selectedCategory?.attributes?.length || 0) + 1,
    });
    setError(null);
    setIsAttrCreateOpen(true);
  };

  const handleOpenAttrEdit = (attr: any) => {
    setSelectedAttr(attr);
    attrForm.reset({
      nama: attr.nama,
      required: attr.required,
      fieldType: attr.fieldType,
      displayOrder: attr.displayOrder,
    });
    setError(null);
    setIsAttrEditOpen(true);
  };

  const onAttrCreateSubmit = async (values: AttributeFormValues) => {
    if (!selectedCatId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createCategoryAttributeAction({
        categoryId: selectedCatId,
        nama: values.nama,
        required: values.required,
        fieldType: values.fieldType,
        displayOrder: values.displayOrder,
      });
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setIsAttrCreateOpen(false);
        attrForm.reset();
        router.refresh();
      }
    } catch (err) {
      setError("Gagal menambahkan atribut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAttrEditSubmit = async (values: AttributeFormValues) => {
    if (!selectedAttr) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateCategoryAttributeAction(selectedAttr.id, {
        nama: values.nama,
        required: values.required,
        fieldType: values.fieldType,
        displayOrder: values.displayOrder,
      });
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setIsAttrEditOpen(false);
        setSelectedAttr(null);
        attrForm.reset();
        router.refresh();
      }
    } catch (err) {
      setError("Gagal memperbarui atribut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttrDelete = (attr: any) => {
    setDeleteAttrTarget(attr);
  };

  const handleAttrDeleteConfirmed = async () => {
    if (!deleteAttrTarget) return;
    try {
      const res = await deleteCategoryAttributeAction(deleteAttrTarget.id);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus atribut.");
    } finally {
      setDeleteAttrTarget(null);
    }
  };

  return (
    <>
    <div className="space-y-6 pt-0 pb-8 -mt-6">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-b-3xl shadow-sm -mx-6 sm:-mx-8 px-6 sm:px-12 mb-8 relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">Master Kategori Aset</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Atur kategori klasifikasi aset dan definisikan atribut spesifik tambahan secara dinamis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Category List */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-xs h-full flex flex-col">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Tags className="h-5 w-5 text-emerald-600" />
                  Kategori Aset
                </CardTitle>
                <CardDescription>Daftar klasifikasi utama aset</CardDescription>
              </div>
              <Button onClick={handleOpenCatCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px]">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  Belum ada kategori terdaftar
                </div>
              ) : (
                <div className="divide-y">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        selectedCatId === cat.id
                          ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-l-4 border-emerald-600"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-50">
                          {cat.nama}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          KIB {cat.kib?.kode || "B"} • {cat._count?.assets || 0} Aset | {cat.attributes?.length || 0} Atribut
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-70 hover:opacity-100 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenCatEdit(cat, e)}
                          className="h-7 w-7 text-zinc-500 hover:text-amber-600 cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={cat._count?.assets > 0}
                          onClick={(e) => handleCatDelete(cat, e)}
                          className="h-7 w-7 text-zinc-500 hover:text-rose-600 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Attribute Definitions */}
        <div className="md:col-span-2">
          {selectedCategory ? (
            <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-xs h-full flex flex-col">
              <CardHeader className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
                    <Layers className="h-5 w-5" />
                    Atribut Kustom: {selectedCategory.nama}
                  </CardTitle>
                  <CardDescription>
                    Atribut spesifik tambahan yang otomatis muncul saat menginput aset kategori ini
                  </CardDescription>
                </div>
                <Button onClick={handleOpenAttrCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs self-start sm:self-auto flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Tambah Atribut
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
                {(!selectedCategory.attributes || selectedCategory.attributes.length === 0) ? (
                  <div className="p-12 text-center text-zinc-400">
                    <Layers className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-zinc-500">Belum Ada Atribut Tambahan</p>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                      Kategori ini tidak memiliki atribut tambahan kustom. Aset akan diinput dengan atribut standar saja.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                      <TableRow>
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Atribut</TableHead>
                        <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Tipe Input</TableHead>
                        <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 text-center">Wajib Diisi</TableHead>
                        <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 text-center w-24">Urutan</TableHead>
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCategory.attributes.map((attr: any, idx: number) => (
                        <TableRow key={attr.id} className="hover:bg-zinc-50/50">
                          <TableCell className="text-center font-mono text-xs text-zinc-400">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">{attr.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {attr.fieldType === "NUMBER" ? "Angka / Numerik" : "Teks"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {attr.required ? (
                              <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50">Ya</Badge>
                            ) : (
                              <span className="text-xs text-zinc-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{attr.displayOrder}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenAttrEdit(attr)}
                                className="h-8 w-8 text-zinc-500 hover:text-amber-500 cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAttrDelete(attr)}
                                className="h-8 w-8 text-zinc-500 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-center text-zinc-400 h-full">
              <Tags className="h-12 w-12 text-zinc-300 mb-3 animate-pulse" />
              <p className="font-semibold text-zinc-500">Pilih Kategori Aset</p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Pilih salah satu kategori di sebelah kiri untuk melihat dan mengelola atribut dinamisnya.
              </p>
            </Card>
          )}
        </div>

      </div>

      {/* CREATE CATEGORY DIALOG */}
      <Dialog isOpen={isCatCreateOpen} onClose={() => setIsCatCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah Kategori Aset</DialogTitle>
          <DialogDescription>Masukkan nama klasifikasi kategori baru untuk aset inventaris.</DialogDescription>
        </DialogHeader>
        <form onSubmit={catForm.handleSubmit(onCatCreateSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Kategori</label>
            <Input
              placeholder="Contoh: Alat Angkutan Darat"
              {...catForm.register("nama")}
            />
            {catForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{catForm.formState.errors.nama.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Pilih KIB</label>
            <select
              {...catForm.register("kibId")}
              className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" className="bg-background text-foreground">-- Pilih KIB --</option>
              {kibs.map((kib) => (
                <option key={kib.id} value={kib.id} className="bg-background text-foreground">
                  KIB {kib.kode} - {kib.nama}
                </option>
              ))}
            </select>
            {catForm.formState.errors.kibId && <p className="text-xs text-rose-500 mt-1">{catForm.formState.errors.kibId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCatCreateOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambahkan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT CATEGORY DIALOG */}
      <Dialog isOpen={isCatEditOpen} onClose={() => setIsCatEditOpen(false)}>
        <DialogHeader>
          <DialogTitle>Sunting Kategori Aset</DialogTitle>
          <DialogDescription>Ubah nama kategori klasifikasi terpilih.</DialogDescription>
        </DialogHeader>
        <form onSubmit={catForm.handleSubmit(onCatEditSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Kategori</label>
            <Input
              placeholder="Contoh: Alat Angkutan Darat"
              {...catForm.register("nama")}
            />
            {catForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{catForm.formState.errors.nama.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Pilih KIB</label>
            <select
              {...catForm.register("kibId")}
              className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" className="bg-background text-foreground">-- Pilih KIB --</option>
              {kibs.map((kib) => (
                <option key={kib.id} value={kib.id} className="bg-background text-foreground">
                  KIB {kib.kode} - {kib.nama}
                </option>
              ))}
            </select>
            {catForm.formState.errors.kibId && <p className="text-xs text-rose-500 mt-1">{catForm.formState.errors.kibId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCatEditOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* CREATE ATTRIBUTE DIALOG */}
      <Dialog isOpen={isAttrCreateOpen} onClose={() => setIsAttrCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah Atribut Kustom</DialogTitle>
          <DialogDescription>
            Tambahkan parameter isian data kustom baru untuk kategori: **{selectedCategory?.nama}**.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={attrForm.handleSubmit(onAttrCreateSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Atribut</label>
            <Input
              placeholder="Contoh: Nomor Polisi, IP Address"
              {...attrForm.register("nama")}
            />
            {attrForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{attrForm.formState.errors.nama.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Tipe Kolom</label>
              <select 
                {...attrForm.register("fieldType")}
                className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="TEXT" className="bg-background text-foreground">Teks</option>
                <option value="NUMBER" className="bg-background text-foreground">Angka / Numerik</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Urutan Tampilan</label>
              <Input
                type="number"
                {...attrForm.register("displayOrder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="attr-required"
              {...attrForm.register("required")}
              className="h-4.5 w-4.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="attr-required" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
              Atribut ini Wajib Diisi (Required)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAttrCreateOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:pointer-events-none">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambahkan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT ATTRIBUTE DIALOG */}
      <Dialog isOpen={isAttrEditOpen} onClose={() => setIsAttrEditOpen(false)}>
        <DialogHeader>
          <DialogTitle>Sunting Atribut Kustom</DialogTitle>
          <DialogDescription>
            Ubah definisi atribut kustom untuk kategori: **{selectedCategory?.nama}**.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={attrForm.handleSubmit(onAttrEditSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Nama Atribut</label>
            <Input
              placeholder="Contoh: Nomor Polisi, IP Address"
              {...attrForm.register("nama")}
            />
            {attrForm.formState.errors.nama && <p className="text-xs text-rose-500 mt-1">{attrForm.formState.errors.nama.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Tipe Kolom</label>
              <select 
                {...attrForm.register("fieldType")}
                className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="TEXT" className="bg-background text-foreground">Teks</option>
                <option value="NUMBER" className="bg-background text-foreground">Angka / Numerik</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Urutan Tampilan</label>
              <Input
                type="number"
                {...attrForm.register("displayOrder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="attr-edit-required"
              {...attrForm.register("required")}
              className="h-4.5 w-4.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="attr-edit-required" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
              Atribut ini Wajib Diisi (Required)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAttrEditOpen(false)} className="cursor-pointer">
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
      isOpen={!!deleteCatTarget}
      onClose={() => setDeleteCatTarget(null)}
      onConfirm={handleCatDeleteConfirmed}
      title={`Hapus Kategori "${deleteCatTarget?.nama}"?`}
      description="Kategori ini akan dihapus. Pastikan tidak ada aset yang masih menggunakan kategori ini."
      confirmLabel="Ya, Hapus Kategori"
      variant="danger"
    />

    <ConfirmDialog
      isOpen={!!deleteAttrTarget}
      onClose={() => setDeleteAttrTarget(null)}
      onConfirm={handleAttrDeleteConfirmed}
      title={`Hapus Atribut "${deleteAttrTarget?.nama}"?`}
      description="Atribut ini akan dihapus beserta seluruh nilai data aset yang tersimpan pada atribut ini. Tindakan ini tidak dapat dibatalkan."
      confirmLabel="Ya, Hapus Atribut"
      variant="danger"
    />
    </>
  );
}
