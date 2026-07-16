"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAssetAction, updateAssetAction, uploadAssetPhotoAction, deleteTemporaryPhotoAction } from "@/actions/asset";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Kondisi } from "@prisma/client";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Check,
  Star,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2
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
  userRole?: string;
}

export function AssetFormClient({ initialData, distributions, holders, categories, kibs, userRole }: AssetFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(
    searchParams.get("success") === "1" ? "Data aset berhasil disimpan!" : null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);

  // Dialog state variables
  const [showDialog, setShowDialog] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<{
    title: string;
    description: string;
    type: "success" | "error";
  }>({
    title: "",
    description: "",
    type: "success",
  });

  React.useEffect(() => {
    if (successMsg) {
      setDialogConfig({
        title: "Simpan Berhasil",
        description: successMsg,
        type: "success",
      });
      setShowDialog(true);
      setSuccessMsg(null);
    }
  }, [successMsg]);

  React.useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error]);

  const isEditMode = !!initialData;
  const isAdmin = userRole === "ADMINISTRATOR" || userRole === "ADMIN";
  const disableFields = isEditMode && !isAdmin;

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
      kode1: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kode2: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kode3: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kode4: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kode5: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      nomorRegister: z.string().regex(/^\d+$/, "Wajib berupa angka"),
      kibId: z.string().min(1, "KIB wajib diisi"),
      categoryId: z.string().min(1, "Kategori wajib diisi"),
      namaAset: z.string().min(1, "Nama aset wajib diisi"),
      merkType: z.string().min(1, "Merk/Type wajib diisi"),
      material: z.string().nullable().optional(),
      caraPerolehan: z.string().nullable().optional(),
      spesifikasi: z.string().nullable().optional(),
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
        material: initialData.material || null,
        caraPerolehan: initialData.caraPerolehan || null,
        spesifikasi: initialData.spesifikasi || null,
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
        material: null,
        caraPerolehan: null,
        spesifikasi: null,
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
  const watchKondisi = watch("kondisi") as string;

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

  // Auto-set kibId to KIB B since the selector is locked (only KIB B exists)
  React.useEffect(() => {
    const kibB = kibs.find((k: any) => k.kode === "B");
    if (kibB && !watchKibId) {
      setValue("kibId", kibB.id, { shouldValidate: true });
    }
  }, [kibs, watchKibId, setValue]);

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
  const previewKode1 = React.useMemo(() => {
    const valInt = parseInt(watchKode1, 10);
    if (!isNaN(valInt)) return String(valInt).padStart(2, '0');
    return watchKode1 || "XX";
  }, [watchKode1]);

  const previewKode2 = React.useMemo(() => {
    const valInt = parseInt(watchKode2, 10);
    if (!isNaN(valInt)) return String(valInt).padStart(2, '0');
    return watchKode2 || "XX";
  }, [watchKode2]);

  const previewKode3 = React.useMemo(() => {
    const valInt = parseInt(watchKode3, 10);
    if (!isNaN(valInt)) return String(valInt).padStart(2, '0');
    return watchKode3 || "XX";
  }, [watchKode3]);

  const previewKode4 = React.useMemo(() => {
    const valInt = parseInt(watchKode4, 10);
    if (!isNaN(valInt)) return String(valInt).padStart(2, '0');
    return watchKode4 || "XX";
  }, [watchKode4]);

  const previewKode5 = React.useMemo(() => {
    const valInt = parseInt(watchKode5, 10);
    if (!isNaN(valInt)) return String(valInt).padStart(3, '0');
    return watchKode5 || "XXX";
  }, [watchKode5]);

  const previewRegister = React.useMemo(() => {
    const regInt = parseInt(watchRegister, 10);
    if (!isNaN(regInt)) {
      return String(regInt).padStart(4, '0');
    }
    return watchRegister || "XXXX";
  }, [watchRegister]);

  const kodeLengkapPreview = `1.3.${previewKode1}.${previewKode2}.${previewKode3}.${previewKode4}.${previewKode5}.${previewRegister}`;

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

  const onError = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDialogConfig({
      title: "Validasi Gagal",
      description: "Harap periksa kembali isian form. Beberapa bidang wajib diisi dengan benar.",
      type: "error",
    });
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    if (userRole === "DEMO") {
      setDialogConfig({
        title: "Demo Only",
        description: "Anda tidak diizinkan melakukan perubahan.",
        type: "error",
      });
      setShowDialog(true);
      return;
    }

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
          setSuccessMsg(null);
          setIsSubmitting(false);
          setDialogConfig({
            title: "Gagal Menyimpan",
            description: res.error,
            type: "error",
          });
          setShowDialog(true);
        } else if (res.success) {
          setError(null);
          setIsSubmitting(false);
          setDialogConfig({
            title: "Simpan Berhasil",
            description: "Data aset berhasil diperbarui!",
            type: "success",
          });
          setShowDialog(true);
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
          setSuccessMsg(null);
          setIsSubmitting(false);
          setDialogConfig({
            title: "Gagal Menyimpan",
            description: res.error,
            type: "error",
          });
          setShowDialog(true);
        } else if (res.success) {
          // Stay on edit page by redirecting to the newly created asset's edit URL
          router.push(`/assets/${res.asset.id}/edit?success=1`);
        }
      }
    } catch (err) {
      console.error("Asset form submission error:", err);
      setError("Terjadi kesalahan saat menyimpan data aset.");
      setIsSubmitting(false);
      setDialogConfig({
        title: "Sistem Error",
        description: "Terjadi kesalahan sistem saat memproses penyimpanan data aset.",
        type: "error",
      });
      setShowDialog(true);
    }
  };

  return (
    <div className="space-y-4 pt-0 pb-8">
      {/* Hero Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 px-4 sm:px-6 py-5 rounded-2xl shadow-sm mb-2">
        <div className="flex items-center gap-4">
          <Link href="/assets" prefetch={false}>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {isEditMode ? "Edit Aset" : "Tambah Aset Baru"}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              {isEditMode
                ? "Ubah data inventaris barang milik daerah."
                : "Masukkan data spesifikasi barang baru ke dalam inventaris."}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 text-sm font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="max-w-4xl mx-auto space-y-4">
        {/* Card 1: Identitas & Klasifikasi Aset */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-6 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">1. Identitas & Klasifikasi Aset</CardTitle>
            <CardDescription className="text-xs">Tentukan kategori, kode register, nama, dan merk barang.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {/* KIB & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Klasifikasi KIB <span className="text-rose-500">*</span>
                </label>
                <input type="hidden" {...register("kibId")} />
                <div className="w-full h-9 rounded-md border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-850 px-3 py-2 text-sm flex items-center gap-2 cursor-not-allowed max-w-[360px]">
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {(() => { const kibB = kibs.find((k: any) => k.kode === "B"); return kibB ? `KIB ${kibB.kode} - ${kibB.nama}` : "KIB B - Peralalan dan Mesin"; })()}
                  </span>
                </div>
                {errors.kibId && <p className="text-xs text-rose-500 mt-1">{errors.kibId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Kategori Aset <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("categoryId")}
                  disabled={!watchKibId}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-w-[360px]"
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

            {/* Kode & Register */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Kode Klasifikasi Aset <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5 w-[280px]">
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold h-9 text-sm px-1"
                      {...register("kode1")}
                    />
                    {errors.kode1 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode1.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold h-9 text-sm px-1"
                      {...register("kode2")}
                    />
                    {errors.kode2 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode2.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold h-9 text-sm px-1"
                      {...register("kode3")}
                    />
                    {errors.kode3 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode3.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XX"
                      maxLength={2}
                      className="text-center font-mono font-bold h-9 text-sm px-1"
                      {...register("kode4")}
                    />
                    {errors.kode4 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode4.message}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="XXX"
                      maxLength={3}
                      className="text-center font-mono font-bold h-9 text-sm px-1"
                      {...register("kode5")}
                    />
                    {errors.kode5 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode5.message}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Nomor Register <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="XXXX"
                  maxLength={4}
                  className="text-center font-mono font-bold h-9 text-sm px-2 w-[120px]"
                  {...register("nomorRegister")}
                />
                {errors.nomorRegister && <p className="text-[10px] text-rose-500 mt-1">{errors.nomorRegister.message}</p>}
              </div>

              {/* Compiled Code Preview */}
              <div className="flex items-center justify-start gap-2 px-3 h-9 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 text-xs flex-1 min-w-[280px] max-w-[360px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Format Kode Lengkap:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm tracking-wider whitespace-nowrap">
                  {kodeLengkapPreview}
                </span>
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
                  className="h-9 text-sm max-w-md"
                  {...register("namaAset")}
                />
                {errors.namaAset && <p className="text-xs text-rose-500 mt-1">{errors.namaAset.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Merk / Type <span className="text-rose-500">*</span>
                </label>
                <input type="hidden" {...register("merkType")} />

                {!watchCategoryId ? (
                  <div className="text-xs text-zinc-500 italic p-3 border border-dashed rounded-md bg-zinc-50/50 dark:bg-zinc-900/10 max-w-[360px]">
                    Pilih Kategori Aset terlebih dahulu untuk memunculkan pilihan Merk
                  </div>
                ) : availableBrands.length > 0 ? (
                  <div className="space-y-1.5 max-w-[360px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <select
                          value={selectedBrand}
                          onChange={(e) => {
                            setSelectedBrand(e.target.value);
                            if (e.target.value !== "LAINNYA") {
                              setCustomBrand("");
                            }
                          }}
                          className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

                      {selectedBrand && selectedBrand !== "LAINNYA" && (
                        <Input
                          placeholder="Tipe / Model (e.g. L14 Gen 3)"
                          className="h-9 text-sm w-full"
                          value={typeDetail}
                          onChange={(e) => setTypeDetail(e.target.value)}
                        />
                      )}

                      {selectedBrand === "LAINNYA" && (
                        <Input
                          placeholder="Masukkan Merk & Tipe Aset..."
                          className="h-9 text-sm w-full"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <Input
                    placeholder="Contoh: Lenovo L14 Gen 3, Kayu Jati"
                    className="h-9 text-sm max-w-[360px]"
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
          </CardContent>
        </Card>

        {/* Card 2: Spesifikasi & Nilai Perolehan */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-6 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">2. Spesifikasi & Nilai Perolehan</CardTitle>
            <CardDescription className="text-xs">Masukkan spesifikasi fisik, metode perolehan, dan nilai aset.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Material / Bahan
                </label>
                <Input
                  placeholder="Contoh: Aluminium, Kayu Jati, Plastik ABS"
                  className="h-9 text-sm max-w-md"
                  {...register("material")}
                />
                {errors.material && <p className="text-xs text-rose-500 mt-1">{errors.material.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Cara Perolehan
                </label>
                <select
                  {...register("caraPerolehan")}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[360px]"
                >
                  <option value="">-- Pilih Cara Perolehan --</option>
                  <option value="Pembelian">Pembelian</option>
                  <option value="Hibah">Hibah</option>
                  <option value="Produksi Sendiri">Produksi Sendiri</option>
                  <option value="Tukar Menukar">Tukar Menukar</option>
                  <option value="Bantuan Pusat">Bantuan Pusat</option>
                  <option value="Bantuan Provinsi">Bantuan Provinsi</option>
                  <option value="Sumbangan / Donasi">Sumbangan / Donasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                {errors.caraPerolehan && <p className="text-xs text-rose-500 mt-1">{errors.caraPerolehan.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Harga Perolehan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input type="hidden" {...register("harga")} />
                <Input
                  type="text"
                  placeholder="Contoh: 15.000.000"
                  className="h-9 text-sm max-w-md"
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
                  className="h-9 text-sm max-w-[120px]"
                  {...register("tahunPembelian")}
                />
                {errors.tahunPembelian && <p className="text-xs text-rose-500 mt-1">{errors.tahunPembelian.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Spesifikasi Teknis
              </label>
              <textarea
                placeholder="Contoh: Prosesor Intel Core i5 Gen 11, RAM 8GB DDR4, SSD 512GB NVMe, Layar 14 inci FHD IPS"
                rows={2}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-xl"
                {...register("spesifikasi")}
              />
              {errors.spesifikasi && <p className="text-xs text-rose-500 mt-1">{errors.spesifikasi.message}</p>}
            </div>

            {/* Dynamic Attributes Form Section (Embedded inside specifications) */}
            {categoryAttributes.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Atribut Tambahan ({selectedCategory?.nama})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryAttributes.map((attr: any, index: number) => (
                    <div key={`${attr.id}-${index}`} className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                        {attr.nama} {attr.required && <span className="text-rose-500">*</span>}
                      </label>
                      <Input
                        type={attr.fieldType === "NUMBER" ? "number" : "text"}
                        placeholder={`Masukkan ${attr.nama}`}
                        className="h-9 text-sm max-w-md"
                        {...register(`dynamicAttributes.${attr.id}`, {
                          required: attr.required ? `${attr.nama} wajib diisi` : false
                        })}
                      />
                      {errors.dynamicAttributes?.[attr.id] && (
                        <p className="text-xs text-rose-500 mt-1">
                          {(errors.dynamicAttributes as any)[attr.id]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Penempatan & Foto Dokumentasi */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-6 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">3. Penempatan & Foto Dokumentasi</CardTitle>
            <CardDescription className="text-xs">Tentukan penempatan bidang, pemegang barang, kondisi fisik, dan foto dokumentasi.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {isEditMode && userRole === "OPERATOR" && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  Perubahan bidang/distribusi dan pemegang barang hanya dapat dilakukan melalui menu <strong className="font-bold">Mutasi Aset</strong>.
                </div>
              </div>
            )}

            {/* Penempatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  Bidang / Distribusi <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("distributionId")}
                  disabled={disableFields}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-w-md"
                >
                  <option value="">Pilih Bidang</option>
                  {distributions.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama}</option>
                  ))}
                </select>
                {errors.distributionId && <p className="text-xs text-rose-500 mt-1">{errors.distributionId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Pemegang Barang
                </label>
                <select
                  {...register("holderId")}
                  disabled={disableFields}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-w-md"
                >
                  <option value="">Disimpan di Gudang / Inventaris Umum</option>
                  {filteredHolders.map((h) => (
                    <option key={h.id} value={h.id}>{h.nama} ({h.nip})</option>
                  ))}
                </select>
                {errors.holderId && <p className="text-xs text-rose-500 mt-1">{errors.holderId.message}</p>}
              </div>
            </div>

            {/* Kondisi Terkini */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                Kondisi Terkini <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                {[
                  { value: "NORMAL", label: "Baik (B)", color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400" },
                  { value: "RUSAK_RINGAN", label: "Kurang Baik (KB)", color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400" },
                  { value: "RUSAK_BERAT", label: "Rusak Berat (RB)", color: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400" },
                  { value: "HILANG", label: "Hilang (H)", color: "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300" }
                ].map((kondisi) => (
                  <label
                    key={kondisi.value}
                    className={`relative flex cursor-pointer rounded-lg border ${watchKondisi === kondisi.value ? `ring-2 ring-emerald-500 ${kondisi.color}` : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'} p-2 shadow-xs focus:outline-none items-center justify-between`}
                  >
                    <input
                      type="radio"
                      value={kondisi.value}
                      {...register("kondisi")}
                      disabled={isEditMode && userRole !== "ADMINISTRATOR" && userRole !== "ADMIN" && userRole !== "OPERATOR"}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-xs font-semibold">{kondisi.label}</span>
                      </span>
                    </span>
                    {watchKondisi === kondisi.value && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </label>
                ))}
              </div>
              {errors.kondisi && <p className="text-xs text-rose-500 mt-1">{errors.kondisi.message}</p>}
            </div>

            {/* Foto Dokumentasi (Two Column Layout on Desktop for Compactness) */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Foto Dokumentasi Aset
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Column 1: Upload box */}
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors h-[130px]">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                      <span className="text-[11px] font-medium text-zinc-500">Mengupload...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="h-6 w-6 text-emerald-600" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Klik atau Tarik Foto ke Sini
                      </span>
                      <span className="text-[10px] text-zinc-500">JPG, PNG, WEBP s/d 5MB</span>
                    </div>
                  )}
                </div>

                {/* Column 2: Uploaded Previews */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/30 dark:bg-zinc-900/10 min-h-[130px] flex flex-col justify-center">
                  {watchPhotos.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">Belum ada foto yang diunggah</p>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Daftar Foto ({watchPhotos.length}/5)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {watchPhotos.map((photo) => {
                          const isMain = watchFotoUtama === photo.url;
                          return (
                            <div
                              key={photo.url}
                              className={`relative group rounded-lg overflow-hidden border h-16 bg-zinc-100 ${isMain ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200"
                                }`}
                            >
                              <img
                                src={photo.url}
                                alt="Aset"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetMainPhoto(photo.url)}
                                  title={isMain ? "Foto Utama" : "Jadikan Foto Utama"}
                                  className={`p-1 rounded-full cursor-pointer transition-colors ${isMain ? "bg-emerald-500 text-white" : "bg-white text-zinc-800 hover:bg-emerald-50 hover:text-emerald-600"
                                    }`}
                                >
                                  <Star className="h-3 w-3 fill-current" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(photo.url)}
                                  title="Hapus Foto"
                                  className="p-1 rounded-full bg-white text-zinc-800 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              {isMain && (
                                <Badge className="absolute top-1 left-1 bg-emerald-600 text-white border-0 font-medium text-[8px] px-1 py-0 shadow-sm flex items-center gap-0.5">
                                  Utama
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Catatan Tambahan
              </label>
              <textarea
                placeholder="Contoh: Didanai oleh dana APBD 2026, Penempatan di ruang Aula utama."
                rows={2}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-xl"
                {...register("catatan")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Action Box - Spanning bottom of the page */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm mt-6">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link href="/assets" prefetch={false} className="w-full sm:w-auto order-2 sm:order-1">
              <Button variant="outline" type="button" className="w-full cursor-pointer h-10 px-6">
                Batalkan
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer h-10 px-8 disabled:pointer-events-none"
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
          </CardContent>
        </Card>
      </form>

      {/* Success/Error Dialog Notification */}
      <Dialog 
        isOpen={showDialog} 
        onClose={() => setShowDialog(false)}
        className="max-w-[360px] rounded-3xl p-7 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-2xl relative"
      >
        <div className="flex flex-col items-center text-center">
          {dialogConfig.type === "success" ? (
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30">
                <Check className="h-7 w-7 stroke-[3]" />
              </div>
            </div>
          ) : (
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-rose-100 dark:bg-rose-950/40 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 dark:bg-rose-500 text-white shadow-lg shadow-rose-600/30">
                <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
              </div>
            </div>
          )}

          <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            {dialogConfig.title}
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed font-medium max-w-[280px]">
            {dialogConfig.description}
          </p>

          <button
            type="button"
            onClick={() => setShowDialog(false)}
            className={`w-full mt-7 py-3 px-5 rounded-2xl font-extrabold text-sm tracking-wide shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${
              dialogConfig.type === "success"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/15 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
            }`}
          >
            OK
          </button>
        </div>
      </Dialog>
    </div>
  );
}
