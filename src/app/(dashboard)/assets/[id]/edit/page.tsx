import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAssetById } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { getAllDistributions } from "@/services/distribution";
import { getAllHolders } from "@/services/holder";
import { getAllCategories } from "@/services/category";
import { getAllKibs } from "@/services/kib";
import { AssetFormClient } from "../../AssetFormClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Edit Aset - SIM Inventaris Aset OPD",
  description: "Formulir perubahan spesifikasi barang inventaris.",
};

interface EditAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Block Manager (read-only)
  if (session.user.role === Role.MANAGER) {
    redirect("/assets");
  }

  const { id } = await params;
  const opdId = session.user.opdId;

  try {
    const asset = await getAssetById(id);
    if (!asset || asset.opdId !== opdId) {
      notFound();
    }

    const [distributions, holders, categories, kibs] = await Promise.all([
      getAllDistributions(opdId),
      getAllHolders(opdId),
      getAllCategories(),
      getAllKibs()
    ]);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedAsset = {
      id: asset.id,
      kode1: String(asset.kode1).padStart(2, '0'),
      kode2: String(asset.kode2).padStart(2, '0'),
      kode3: String(asset.kode3).padStart(2, '0'),
      kode4: String(asset.kode4).padStart(2, '0'),
      kode5: String(asset.kode5).padStart(2, '0'),
      nomorRegister: asset.nomorRegister,
      categoryId: asset.categoryId,
      namaAset: asset.namaAset,
      merkType: asset.merkType,
      material: (asset as any).material || null,
      caraPerolehan: (asset as any).caraPerolehan || null,
      spesifikasi: (asset as any).spesifikasi || null,
      harga: asset.harga,
      tahunPembelian: asset.tahunPembelian,
      distributionId: asset.distributionId,
      holderId: asset.holderId,
      kondisi: asset.kondisi,
      catatan: asset.catatan,
      // Pass raw key or generate URL
      fotoUtama: asset.fotoUtama ? DocumentService.generateFileUrl(asset.fotoUtama) : "",
      photos: asset.photos ? (asset as any).photos.map((photo: any) => ({
        id: photo.id,
        url: DocumentService.generateFileUrl(photo.objectKey),
        objectKey: photo.objectKey,
        originalFileName: photo.originalFileName,
        mimeType: photo.mimeType,
        size: photo.size,
      })) : [],
      attributes: asset.attributes.map((attr) => ({
        categoryAttributeId: attr.categoryAttributeId,
        value: attr.value,
      })),
    };

    const serializedDistributions = distributions.map((dist) => ({
      id: dist.id,
      nama: dist.nama,
    }));

    const serializedHolders = holders.map((holder) => ({
      id: holder.id,
      nama: holder.nama,
      jabatan: holder.jabatan,
      distributionId: holder.distributionId,
    }));

    const serializedKibs = kibs.filter(k => k.isActive).map(k => ({
      id: k.id,
      kode: k.kode,
      nama: k.nama,
    }));

    const serializedCategories = categories.map((cat) => ({
      id: cat.id,
      nama: cat.nama,
      kibId: cat.kibId,
      attributes: cat.attributes.map((attr) => ({
        id: attr.id,
        nama: attr.nama,
        required: attr.required,
        fieldType: attr.fieldType,
        displayOrder: attr.displayOrder,
      })),
    }));

    return (
      <AssetFormClient
        initialData={serializedAsset}
        distributions={serializedDistributions}
        holders={serializedHolders}
        categories={serializedCategories}
        kibs={serializedKibs}
      />
    );
  } catch (error) {
    console.error("Failed to load edit asset page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal memuat data aset. Silakan coba kembali.</p>
      </div>
    );
  }
}
