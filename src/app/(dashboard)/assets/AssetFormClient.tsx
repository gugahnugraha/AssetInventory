"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAssetAction, updateAssetAction, uploadAssetPhotoAction, deleteTemporaryPhotoAction } from "@/actions/asset";
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

const BRANDS_BY_CATEGORY: Record<string, string[]> = {
  "Kendaraan": [
    "Toyota",
    "Honda",
    "Suzuki",
    "Mitsubishi",
    "Daihatsu",
    "Nissan",
    "Yamaha",
    "Kawasaki",
    "Hyundai",
    "Kia",
    "Isuzu",
    "Hino",
    "Mazda"
  ],
  "Peralatan Elektronik": [
    "Lenovo",
    "Asus",
    "HP",
    "Dell",
    "Apple",
    "Acer",
    "Samsung",
    "Epson",
    "Canon",
    "Sony",
    "Panasonic",
    "LG",
    "Sharp",
    "Xiaomi",
    "Oppo",
    "Vivo"
  ],
  "Peralatan Jaringan & IT": [
    "Cisco",
    "MikroTik",
    "TP-Link",
    "Ubiquiti",
    "Ruijie",
    "Huawei",
    "D-Link",
    "Synology",
    "HP Enterprise",
    "Aruba",
    "Fortinet",
    "Tenda"
  ],
  "Furnitur": [
    "Olympic",
    "Informa",
    "Chitose",
    "Lion",
    "Brother",
    "Alba",
    "Modera",
    "Expo",
    "Subaru",
    "Indachi"
  ],
  "Peralatan Kantor": [
    "Sharp",
    "Panasonic",
    "Brother",
    "Epson",
    "Canon",
    "Samsung",
    "HP",
    "Toshiba",
    "Fuji Xerox"
  ]
};

const parseMerkType = (merkTypeStr: string, categoryName: string) => {
  if (!merkTypeStr) return { brand: "", customBrand: "", type: "" };
  const brands = BRANDS_BY_CATEGORY[categoryName] || [];
  
  // Find if any brand matches the start of the string (case-insensitive)
  const matchedBrand = brands.find(b => 
    merkTypeStr.toLowerCase().startsWith(b.toLowerCase())
  );

  if (matchedBrand) {
    // Remaining part is the type
    const remaining = merkTypeStr.substring(matchedBrand.length).trim();
    return {
      brand: matchedBrand,
      customBrand: "",
      type: remaining
    };
  }

  // Fallback to "LAINNYA"
  return {
    brand: "LAINNYA",
    customBrand: merkTypeStr,
    type: ""
  };
};

const formatNumberWithSeparator = (value: number | string) => {
  if (value === undefined || value === null || value === "") return "";
  const numString = String(value).replace(/\D/g, "");
  if (!numString) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(numString, 10));
};

interface AssetFormClientProps {
  initialData?: any; // Pre-filled data if edit mode
  distributions: any[];
  holders: any[];
  categories: any[];
  kibs: any[];
}

export function AssetFormClient({ initialData, distributions, holders, categories, kibs }: AssetFormClientProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);

  const isEditMode = !!initialData;

  // Prepopulated brand & type input states
  const [selectedBrand, setSelectedBrand] = React.useState("");
  const [customBrand, setCustomBrand] = React.useState("");
  const [typeDetail, setTypeDetail] = React.useState("");

  // Formatted price display state with thousand separators
  const [formattedHarga, setFormattedHarga] = React.useState("");

  // Track initial KIB from initial category
  const initialCategory = categories.find(c => c.id === (initialData?.categoryId || ""));
  const initialKibId = initialCategory ? initialCategory.kibId : "";

  // Dynamic Zod validation schema to dynamically enforce required attributes
  const schema = React.useMemo(() => {
    return z.object({
      kode1: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
      kode2: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
      kode3: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
      kode4: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
      kode5: z.string().regex(/^\d{2}$/, "Wajib 2 digit angka"),
      nomorRegister: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kibId: z.string().min(1, "KIB wajib diisi"),
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
    }).superRefine((data, ctx) => {
      // Find attributes for the selected category
      const category = categories.find(c => c.id === data.categoryId);
      if (category && category.attributes) {
        category.attributes.forEach((attr: any) => {
          if (attr.required) {
            const val = data.dynamicAttributes?.[attr.id];
            if (!val || val.trim() === "") {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${attr.nama} wajib diisi`,
                path: ["dynamicAttributes", attr.id],
              });
            }
          }
        });
      }
    });
  }, [categories]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          kode1: initialData.kode1 as string,
          kode2: initialData.kode2 as string,
          kode3: initialData.kode3 as string,
          kode4: initialData.kode4 as string,
          kode5: initialData.kode5 as string,
          nomorRegister: initialData.nomorRegister !== undefined ? String(initialData.nomorRegister) : "",
          kibId: initialKibId as string,
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
          kibId: "",
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

  const watchPhotos = (watch("photos") || []) as any[];
  const watchFotoUtama = watch("fotoUtama") as string;
  const watchDistributionId = watch("distributionId") as string;
  const watchKode1 = (watch("kode1") || "") as string;
  const watchKode2 = (watch("kode2") || "") as string;
  const watchKode3 = (watch("kode3") || "") as string;
  const watchKode4 = (watch("kode4") || "") as string;
  const watchKode5 = (watch("kode5") || "") as string;
  const watchRegister = (watch("nomorRegister") || "") as string;
  
  const watchKibId = watch("kibId") as string;
  const watchCategoryId = watch("categoryId") as string;
  
  const filteredCategories = React.useMemo(() => {
    if (!watchKibId) return [];
    return categories.filter(c => c.kibId === watchKibId);
  }, [categories, watchKibId]);

  const selectedCategory = React.useMemo(() => {
    return categories.find(c => c.id === watchCategoryId) || null;
  }, [categories, watchCategoryId]);

  const categoryAttributes = selectedCategory?.attributes || [];

  const availableBrands = React.useMemo(() => {
    if (!selectedCategory) return [];
    return BRANDS_BY_CATEGORY[selectedCategory.nama] || [];
  }, [selectedCategory]);

  // Synchronize dynamic brand states on mount / edit initialData
  React.useEffect(() => {
    if (initialData) {
      const cat = categories.find(c => c.id === initialData.categoryId);
      const parsed = parseMerkType(initialData.merkType || "", cat?.nama || "");
      setSelectedBrand(parsed.brand);
      setCustomBrand(parsed.customBrand);
      setTypeDetail(parsed.type);
    }
  }, [initialData, categories]);

  // Combine Brand and Type values back to hook form "merkType"
  React.useEffect(() => {
    let combined = "";
    if (selectedBrand === "LAINNYA") {
      combined = customBrand.trim();
    } else if (selectedBrand) {
      combined = typeDetail.trim() 
        ? `${selectedBrand} ${typeDetail.trim()}` 
        : selectedBrand;
    } else {
      // If available brands list is empty and user inputted custom brand directly
      const cat = categories.find(c => c.id === watchCategoryId);
      const brandsList = cat ? (BRANDS_BY_CATEGORY[cat.nama] || []) : [];
      if (brandsList.length === 0 && customBrand) {
        combined = customBrand.trim();
      }
    }
    setValue("merkType", combined, { shouldValidate: true });
  }, [selectedBrand, customBrand, typeDetail, watchCategoryId, categories, setValue]);

  // Reset selected brand on category changes
  const prevCategoryIdRef = React.useRef(watchCategoryId);
  React.useEffect(() => {
    if (prevCategoryIdRef.current !== watchCategoryId) {
      prevCategoryIdRef.current = watchCategoryId;
      if (!initialData) {
        setSelectedBrand("");
        setCustomBrand("");
        setTypeDetail("");
      }
    }
  }, [watchCategoryId, initialData]);

  // Synchronize formatted price state on mount / edit initialData
  React.useEffect(() => {
    if (initialData && initialData.harga !== undefined) {
      setFormattedHarga(new Intl.NumberFormat("id-ID").format(initialData.harga));
    } else {
      setFormattedHarga("");
    }
  }, [initialData]);

  // Reset category if KIB changes and no longer matches
  React.useEffect(() => {
    if (watchKibId) {
      const isMatched = filteredCategories.some(c => c.id === watchCategoryId);
      if (!isMatched && watchCategoryId !== "") {
        setValue("categoryId", "");
      }
    }
  }, [watchKibId, filteredCategories, watchCategoryId, setValue]);

  // Compiled asset code preview
  // Compiled asset code preview
  const previewRegister = React.useMemo(() => {
    const regInt = parseInt(watchRegister, 10);
    if (!isNaN(regInt)) {
      return String(regInt).padStart(4, '0');
    }
    return watchRegister || "XXXX";
  }, [watchRegister]);

  const kodeLengkapPreview = `1.3.${watchKode1 || "XX"}.${watchKode2 || "XX"}.${watchKode3 || "XX"}.${watchKode4 || "XX"}.${watchKode5 || "XX"}.${previewRegister}`;

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

    const uploadedUrls: any[] = [];

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

        if (!response.error && "url" in response && "objectKey" in response) {
          uploadedUrls.push({
            url: response.url,
            tempKey: response.objectKey,
            originalFileName: response.originalFileName,
            mimeType: response.mimeType,
            size: response.size,
          });
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
  const handleRemovePhoto = async (urlToRemove: string) => {
    const photoToRemove = watchPhotos.find(p => p.url === urlToRemove);
    if (photoToRemove && photoToRemove.id) {
      setDeletePhotoIds(prev => [...prev, photoToRemove.id]);
    } else if (photoToRemove && photoToRemove.tempKey) {
      await deleteTemporaryPhotoAction(photoToRemove.tempKey);
    }

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
    const { kibId, ...submitValues } = data;

    try {
      if (isEditMode) {
        // Map photos and exclude those that are already committed and not deleted
        const newPhotos = watchPhotos
          .filter((p: any) => !!p.tempKey)
          .map((p: any) => ({
            tempKey: p.tempKey,
            originalFileName: p.originalFileName,
            mimeType: p.mimeType,
            size: p.size,
            isPrimary: p.url === watchFotoUtama,
          }));

        const payload = {
          ...submitValues,
          photos: newPhotos,
          deletePhotoIds,
        };

        const res = await updateAssetAction(initialData.id, payload as any);
        if (res.error) {
          setError(res.error);
          setIsSubmitting(false);
        } else if (res.success) {
          router.push("/assets");
          router.refresh();
        }
      } else {
        const photosPayload = watchPhotos.map((p: any) => ({
          tempKey: p.tempKey || "",
          originalFileName: p.originalFileName || "image.png",
          mimeType: p.mimeType || "image/png",
          size: p.size || 0,
          isPrimary: p.url === watchFotoUtama,
        }));

        const payload = {
          ...submitValues,
          photos: photosPayload,
        };

        const res = await createAssetAction(payload as any);
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
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <div>
                    <Input
                      value="1"
                      disabled
                      readOnly
                      className="text-center font-mono font-bold bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
                    />
                    <p className="text-[10px] text-zinc-400 text-center mt-1">Sistem</p>
                  </div>
                  <div>
                    <Input
                      value="3"
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
                      placeholder="e.g. 1"
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

              {/* KIB & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Klasifikasi KIB <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("kibId")}
                    className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" className="bg-background text-foreground">Pilih KIB</option>
                    {kibs.map((k) => (
                      <option key={k.id} value={k.id} className="bg-background text-foreground">
                        KIB {k.kode} - {k.nama}
                      </option>
                    ))}
                  </select>
                  {errors.kibId && <p className="text-xs text-rose-500 mt-1">{errors.kibId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Kategori Aset <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("categoryId")}
                    disabled={!watchKibId}
                    className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="" className="bg-background text-foreground">Pilih Kategori</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-background text-foreground">
                        {c.nama}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-xs text-rose-500 mt-1">{errors.categoryId.message}</p>}
                </div>
              </div>

              {/* Nama Aset & Merk/Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Merk / Type <span className="text-rose-500">*</span>
                  </label>
                  {/* Keep react-hook-form registered and updated */}
                  <input type="hidden" {...register("merkType")} />

                  {!watchCategoryId ? (
                    <div className="text-xs text-zinc-500 italic p-3 border border-dashed rounded-md bg-zinc-50/50 dark:bg-zinc-900/10">
                      Pilih Kategori Aset terlebih dahulu untuk memunculkan pilihan Merk
                    </div>
                  ) : availableBrands.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Brand Select Dropdown */}
                        <div>
                          <select
                            value={selectedBrand}
                            onChange={(e) => {
                              setSelectedBrand(e.target.value);
                              if (e.target.value !== "LAINNYA") {
                                setCustomBrand("");
                              }
                            }}
                            className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="" className="bg-background text-foreground">Pilih Merk / Brand</option>
                            {availableBrands.map((b) => (
                              <option key={b} value={b} className="bg-background text-foreground">
                                {b}
                              </option>
                            ))}
                            <option value="LAINNYA" className="bg-background text-foreground font-semibold">Lainnya (Input Manual)</option>
                          </select>
                        </div>

                        {/* Type/Model Details Input (shown if predefined brand is selected) */}
                        {selectedBrand && selectedBrand !== "LAINNYA" && (
                          <Input
                            placeholder="Tipe / Model (e.g. L14 Gen 3)"
                            value={typeDetail}
                            onChange={(e) => setTypeDetail(e.target.value)}
                          />
                        )}

                        {/* Custom Brand Input (shown if "Lainnya" is selected) */}
                        {selectedBrand === "LAINNYA" && (
                          <Input
                            placeholder="Masukkan Merk & Tipe Aset..."
                            value={customBrand}
                            onChange={(e) => setCustomBrand(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <Input
                      placeholder="Contoh: Lenovo L14 Gen 3, Kayu Jati"
                      value={customBrand}
                      onChange={(e) => {
                        setSelectedBrand("LAINNYA");
                        setCustomBrand(e.target.value);
                      }}
                    />
                  )}
                  {errors.merkType && <p className="text-xs text-rose-500 mt-1">{errors.merkType.message}</p>}
                </div>
              </div>

              {/* Harga & Tahun Perolehan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Harga Perolehan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  {/* Keep react-hook-form registered */}
                  <input type="hidden" {...register("harga")} />
                  <Input
                    type="text"
                    placeholder="Contoh: 15.000.000"
                    value={formattedHarga}
                    onChange={(e) => {
                      const rawValStr = e.target.value.replace(/\D/g, "");
                      const rawNum = rawValStr ? parseInt(rawValStr, 10) : 0;
                      setFormattedHarga(formatNumberWithSeparator(rawValStr));
                      setValue("harga", rawNum, { shouldValidate: true });
                    }}
                  />
                  {errors.harga && <p className="text-xs text-rose-500 mt-1">{errors.harga.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Tahun Perolehan <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Tahun"
                    {...register("tahunPembelian")}
                  />
                  {errors.tahunPembelian && <p className="text-xs text-rose-500 mt-1">{errors.tahunPembelian.message}</p>}
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

          {/* Placement & Holder & Kondisi */}
          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Penempatan & Kondisi Aset</CardTitle>
              <CardDescription>Pilih bidang penempatan, pemegang tanggung jawab, dan kondisi fisik barang.</CardDescription>
            </CardHeader>
            {isEditMode && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  Penempatan Bidang, Pemegang Barang, dan Kondisi tidak dapat diubah dari formulir edit. 
                  Gunakan menu <strong>Mutasi Aset</strong> jika ingin memindahkan/memutasi barang atau mengubah kondisi.
                </span>
              </div>
            )}
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Distribution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Bidang Distribusi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("distributionId")}
                    disabled={isEditMode}
                    className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-background text-foreground">Pilih Bidang</option>
                    {distributions.map(d => (
                      <option key={d.id} value={d.id} className="bg-background text-foreground">{d.nama}</option>
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
                    disabled={isEditMode || !watchDistributionId}
                    className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-background text-foreground">Tanpa Pemegang (Di Simpan di Gudang/Umum)</option>
                    {filteredHolders.map(h => (
                      <option key={h.id} value={h.id} className="bg-background text-foreground">{h.nama} ({h.jabatan})</option>
                    ))}
                  </select>
                  {!watchDistributionId && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                      * Pilih bidang kerja terlebih dahulu untuk melihat daftar pemegang barang.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kondisi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Kondisi Barang
                  </label>
                  <select
                    {...register("kondisi")}
                    disabled={isEditMode}
                    className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={Kondisi.NORMAL} className="bg-background text-foreground">Normal (Baik)</option>
                    <option value={Kondisi.RUSAK_RINGAN} className="bg-background text-foreground">Rusak Ringan</option>
                    <option value={Kondisi.RUSAK_BERAT} className="bg-background text-foreground">Rusak Berat</option>
                    <option value={Kondisi.DALAM_PERBAIKAN} className="bg-background text-foreground">Dalam Perbaikan</option>
                    <option value={Kondisi.DIPINJAM} className="bg-background text-foreground">Dipinjam</option>
                    <option value={Kondisi.HILANG} className="bg-background text-foreground">Hilang</option>
                  </select>
                  {errors.kondisi && <p className="text-xs text-rose-500 mt-1">{errors.kondisi.message}</p>}
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
