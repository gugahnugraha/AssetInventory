"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAssetAction, updateAssetAction, uploadAssetPhotoAction } from "@/actions/asset";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kondisi } from "@prisma/client";
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Check, 
  Star,
  Loader2,
  AlertTriangle,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

const assetSchema = z.object({
  kode1: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
  kode2: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
  kode3: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
  kode4: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
  kode5: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
  nomorRegister: z.string().regex(/^\d{3}$/, "Wajib 3 digit angka"),
  categoryId: z.string().min(1, "Kategori wajib diisi"),
  namaAset: z.string().min(1, "Nama aset wajib diisi"),
  merkType: z.string().min(1, "Merk/Type wajib diisi"),
  harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  tahunPembelian: z.coerce.number()
    .min(1900, "Tahun tidak valid")
    .max(new Date().getFullYear(), `Tahun maksimal ${new Date().getFullYear()}`),
  distributionId: z.string().min(1, "Bidang/Distribusi wajib diisi"),
  holderId: z.string().nullable().optional(),
  kondisi: z.nativeEnum(Kondisi),
  catatan: z.string().nullable().optional(),
  fotoUtama: z.string().nullable().optional(),
  photos: z.array(
    z.object({
      url: z.string(),
      caption: z.string().nullable().optional(),
    })
  ).default([]),
  dynamicAttributes: z.record(z.string(), z.string()).optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormClientProps {
  initialData?: any; // Pre-filled data if edit mode
  distributions: any[];
  holders: any[];
  categories: any[];
}

export function AssetFormClient({ initialData, distributions, holders, categories }: AssetFormClientProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData
      ? {
          kode1: initialData.kode1 as string,
          kode2: initialData.kode2 as string,
          kode3: initialData.kode3 as string,
          kode4: initialData.kode4 as string,
          kode5: initialData.kode5 as string,
          nomorRegister: initialData.nomorRegister as string,
          categoryId: initialData.categoryId as string,
          namaAset: initialData.namaAset as string,
          merkType: initialData.merkType as string,
          harga: initialData.harga as number,
          tahunPembelian: initialData.tahunPembelian as number,
          distributionId: initialData.distributionId as string,
          holderId: initialData.holderId as string | null,
          kondisi: initialData.kondisi,
          catatan: initialData.catatan || "",
          fotoUtama: initialData.fotoUtama || "",
          photos: initialData.photos || [],
          dynamicAttributes: initialData.attributes?.reduce((acc: any, attr: any) => {
            acc[attr.categoryAttributeId] = attr.value;
            return acc;
          }, {}) || {},
        }
      : {
          kode1: "",
          kode2: "",
          kode3: "",
          kode4: "",
          kode5: "",
          nomorRegister: "",
          categoryId: "",
          namaAset: "",
          merkType: "",
          harga: 0,
          tahunPembelian: new Date().getFullYear(),
          distributionId: "",
          holderId: null,
          kondisi: Kondisi.NORMAL,
          catatan: "",
          fotoUtama: "",
          photos: [],
          dynamicAttributes: {},
        },
  });

  const watchPhotos = (watch("photos") || []) as { url: string; caption?: string | null }[];
  const watchFotoUtama = watch("fotoUtama") as string;
  const watchDistributionId = watch("distributionId") as string;
  const watchKode1 = (watch("kode1") || "") as string;
  const watchKode2 = (watch("kode2") || "") as string;
  const watchKode3 = (watch("kode3") || "") as string;
  const watchKode4 = (watch("kode4") || "") as string;
  const watchKode5 = (watch("kode5") || "") as string;
  const watchRegister = (watch("nomorRegister") || "") as string;
  
  const watchCategoryId = watch("categoryId") as string;
  const selectedCategory = React.useMemo(() => {
    return categories.find(c => c.id === watchCategoryId) || null;
  }, [categories, watchCategoryId]);

  const categoryAttributes = selectedCategory?.attributes || [];

  // Compiled asset code preview
  const kodeLengkapPreview = `01.03.${watchKode1 || "XX"}.${watchKode2 || "XX"}.${watchKode3 || "XX"}.${watchKode4 || "XX"}.${watchKode5 || "XX"}.${watchRegister || "XXX"}`;

  // Filter holders based on selected distribution/department
  const filteredHolders = React.useMemo(() => {
    if (!watchDistributionId) return [];
    return holders.filter(h => h.distributionId === watchDistributionId);
  }, [holders, watchDistributionId]);

  // If selected distribution changes, reset holderId if it doesn't belong to the new distribution
  React.useEffect(() => {
    if (watchDistributionId) {
      const isHolderValid = filteredHolders.some(h => h.id === watch("holderId"));
      if (!isHolderValid) {
        setValue("holderId", null);
      }
    }
  }, [watchDistributionId, filteredHolders, setValue, watch]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedUrls: { url: string; caption: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Client side file check
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal adalah 5 MB.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await uploadAssetPhotoAction(formData);
        if (response.error) {
          setError(response.error);
          setUploading(false);
          return;
        }

        if (response.url) {
          uploadedUrls.push({ url: response.url, caption: file.name });
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("Terjadi kesalahan saat mengunggah foto.");
        setUploading(false);
        return;
      }
    }

    const currentPhotos = [...watchPhotos];
    const newPhotos = [...currentPhotos, ...uploadedUrls];
    setValue("photos", newPhotos);

    // If there is no main photo set, select the first upload
    if (!watchFotoUtama && newPhotos.length > 0) {
      setValue("fotoUtama", newPhotos[0].url);
    }

    setUploading(false);
  };

  // Remove Photo
  const handleRemovePhoto = (urlToRemove: string) => {
    const newPhotos = watchPhotos.filter(p => p.url !== urlToRemove);
    setValue("photos", newPhotos);

    // If the main photo is removed, update it
    if (watchFotoUtama === urlToRemove) {
      setValue("fotoUtama", newPhotos.length > 0 ? newPhotos[0].url : "");
    }
  };

  // Set Main Photo
  const handleSetMainPhoto = (url: string) => {
    setValue("fotoUtama", url);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    const values = data as AssetFormValues;

    try {
      if (isEditMode) {
        const res = await updateAssetAction(initialData.id, values);
        if (res.error) {
          setError(res.error);
          setIsSubmitting(false);
        } else if (res.success) {
          router.push("/assets");
          router.refresh();
        }
      } else {
        const res = await createAssetAction(values);
        if (res.error) {
          setError(res.error);
          setIsSubmitting(false);
        } else if (res.success) {
          router.push("/assets");
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Asset form submission error:", err);
      setError("Terjadi kesalahan saat menyimpan data aset.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/assets" prefetch={false}>
          <Button variant="outline" size="icon" className="rounded-full h-8 w-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isEditMode ? "Edit Aset" : "Tambah Aset Baru"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {isEditMode 
              ? "Ubah data inventaris barang milik daerah." 
              : "Masukkan data spesifikasi barang baru ke dalam inventaris."}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-sm font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (Left/Center) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Identitas & Kode Aset</CardTitle>
              <CardDescription>Masukkan kode register dan nama jenis aset barang.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Asset Code Parts */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Kode Klasifikasi & Register
                </label>
                <div className="grid grid-cols-8 gap-2">
                  <div>
                    <Input
                      value="01"
                      disabled
                      readOnly
                      className="text-center font-mono font-bold bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
                    />
                    <p className="text-[10px] text-zinc-400 text-center mt-1">Sistem</p>
                  </div>
                  <div>
                    <Input
                      value="03"
                      disabled
                      readOnly
                      className="text-center font-mono font-bold bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
                    />
                    <p className="text-[10px] text-zinc-400 text-center mt-1">Sistem</p>
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold"
                      {...register("kode1")}
                    />
                    {errors.kode1 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode1.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold"
                      {...register("kode2")}
                    />
                    {errors.kode2 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode2.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold"
                      {...register("kode3")}
                    />
                    {errors.kode3 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode3.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold"
                      {...register("kode4")}
                    />
                    {errors.kode4 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode4.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold"
                      {...register("kode5")}
                    />
                    {errors.kode5 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode5.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XXX"
                      maxLength={3}
                      className="text-center font-mono font-bold border-emerald-500 focus-visible:ring-emerald-500 bg-emerald-500/5"
                      {...register("nomorRegister")}
                    />
                    {errors.nomorRegister && <p className="text-[10px] text-rose-500 mt-1">{errors.nomorRegister.message}</p>}
                  </div>
                </div>

                {/* Compiled Preview */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-sm mt-2">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Format Kode Lengkap:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base tracking-wider">
                    {kodeLengkapPreview}
                  </span>
                </div>
              </div>

              {/* Kategori & Nama Aset & Merk & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Kategori Aset <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("categoryId")}
                    className="w-full h-10 rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-xs text-rose-500 mt-1">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Nama Aset <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Mobil Avanza, Laptop ThinkPad"
                    {...register("namaAset")}
                  />
                  {errors.namaAset && <p className="text-xs text-rose-500 mt-1">{errors.namaAset.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Merk / Type <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Lenovo L14 Gen 3, Kayu Jati"
                    {...register("merkType")}
                  />
                  {errors.merkType && <p className="text-xs text-rose-500 mt-1">{errors.merkType.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Harga Perolehan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Contoh: 15000000"
                    {...register("harga")}
                  />
                  {errors.harga && <p className="text-xs text-rose-500 mt-1">{errors.harga.message}</p>}
                </div>
              </div>

              {/* Tahun Pembelian & Kondisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Tahun Pembelian
                  </label>
                  <Input
                    type="number"
                    placeholder="Tahun"
                    {...register("tahunPembelian")}
                  />
                  {errors.tahunPembelian && <p className="text-xs text-rose-500 mt-1">{errors.tahunPembelian.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Kondisi Barang
                  </label>
                  <select
                    {...register("kondisi")}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={Kondisi.NORMAL}>Normal (Baik)</option>
                    <option value={Kondisi.RUSAK_RINGAN}>Rusak Ringan</option>
                    <option value={Kondisi.RUSAK_BERAT}>Rusak Berat</option>
                    <option value={Kondisi.DALAM_PERBAIKAN}>Dalam Perbaikan</option>
                    <option value={Kondisi.DIPINJAM}>Dipinjam</option>
                    <option value={Kondisi.HILANG}>Hilang</option>
                  </select>
                  {errors.kondisi && <p className="text-xs text-rose-500 mt-1">{errors.kondisi.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Attributes Form Section */}
          {categoryAttributes.length > 0 && (
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardTitle className="text-emerald-700 font-bold">Atribut Tambahan ({selectedCategory?.nama})</CardTitle>
                <CardDescription>Atribut kustom spesifik untuk kategori ini.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryAttributes.map((attr: any) => (
                  <div key={attr.id} className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      {attr.nama}
                      {attr.required && <span className="text-rose-500">*</span>}
                    </label>
                    <Input
                      type={attr.fieldType === "NUMBER" ? "number" : "text"}
                      placeholder={`Masukkan ${attr.nama.toLowerCase()}`}
                      {...register(`dynamicAttributes.${attr.id}`, {
                        required: attr.required ? `${attr.nama} wajib diisi` : false
                      })}
                    />
                    {errors.dynamicAttributes?.[attr.id] && (
                      <p className="text-xs text-rose-500 mt-1">
                        {(errors.dynamicAttributes[attr.id] as any).message}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Placement & Holder */}
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Penempatan & Penanggung Jawab</CardTitle>
              <CardDescription>Pilih bidang kerja dan nama pemegang barang.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Distribution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Bidang Distribusi
                  </label>
                  <select
                    {...register("distributionId")}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Pilih Bidang</option>
                    {distributions.map(d => (
                      <option key={d.id} value={d.id}>{d.nama}</option>
                    ))}
                  </select>
                  {errors.distributionId && <p className="text-xs text-rose-500 mt-1">{errors.distributionId.message}</p>}
                </div>

                {/* Holder */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Pemegang Barang
                  </label>
                  <select
                    {...register("holderId")}
                    disabled={!watchDistributionId}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Tanpa Pemegang (Di Simpan di Gudang/Umum)</option>
                    {filteredHolders.map(h => (
                      <option key={h.id} value={h.id}>{h.nama} ({h.jabatan})</option>
                    ))}
                  </select>
                  {!watchDistributionId && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                      * Pilih bidang kerja terlebih dahulu untuk melihat daftar pemegang barang.
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Catatan Tambahan
                </label>
                <textarea
                  placeholder="Contoh: Didanai oleh dana APBD 2026, Penempatan di ruang Aula utama."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("catatan")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Upload Sidebar (Right) */}
        <div className="space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Foto Dokumentasi</CardTitle>
              <CardDescription>Upload foto aset (Maks. 5MB, format: JPG/PNG/WEBP).</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Upload Trigger Box */}
              <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                    <span className="text-xs font-medium text-zinc-500">Mengupload foto...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-emerald-600" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Klik atau Tarik Foto ke Sini
                    </span>
                    <span className="text-[10px] text-zinc-500">JPG, PNG, atau WEBP hingga 5MB</span>
                  </div>
                )}
              </div>

              {/* Uploaded Previews */}
              {watchPhotos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Daftar Foto Aset ({watchPhotos.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {watchPhotos.map((photo) => {
                      const isMain = watchFotoUtama === photo.url;
                      return (
                        <div
                          key={photo.url}
                          className={`relative group rounded-lg overflow-hidden border h-28 bg-zinc-100 ${
                            isMain ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200"
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt="Aset"
                            className="w-full h-full object-cover"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetMainPhoto(photo.url)}
                              title={isMain ? "Foto Utama" : "Jadikan Foto Utama"}
                              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                                isMain ? "bg-emerald-500 text-white" : "bg-white text-zinc-800 hover:bg-emerald-50 hover:text-emerald-600"
                              }`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.url)}
                              title="Hapus Foto"
                              className="p-1.5 rounded-full bg-white text-zinc-800 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {isMain && (
                            <Badge className="absolute top-1.5 left-1.5 bg-emerald-600 text-white border-0 font-medium text-[9px] px-1 py-0 shadow-sm flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              Utama
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Action Box */}
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardContent className="p-4 space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting || uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer h-10 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Data Aset"
                )}
              </Button>
              <Link href="/assets" prefetch={false} className="block">
                <Button variant="outline" type="button" className="w-full cursor-pointer h-10">
                  Batalkan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
