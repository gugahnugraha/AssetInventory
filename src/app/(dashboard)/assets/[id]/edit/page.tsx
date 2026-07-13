import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAssetById } from "@/services/asset";
import { getAllDistributions } from "@/services/distribution";
import { getAllHolders } from "@/services/holder";
import { getAllCategories } from "@/services/category";
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

    const distributions = await getAllDistributions(opdId);
    const holders = await getAllHolders(opdId);
    const categories = await getAllCategories();

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedAsset = {
      id: asset.id,
      kode1: asset.kode1,
      kode2: asset.kode2,
      kode3: asset.kode3,
      kode4: asset.kode4,
      kode5: asset.kode5,
      nomorRegister: asset.nomorRegister,
      categoryId: asset.categoryId,
      namaAset: asset.namaAset,
      merkType: asset.merkType,
      harga: asset.harga,
      tahunPembelian: asset.tahunPembelian,
      distributionId: asset.distributionId,
      holderId: asset.holderId,
      kondisi: asset.kondisi,
      catatan: asset.catatan,
      fotoUtama: asset.fotoUtama,
      photos: asset.photos.map((photo) => ({
        url: photo.url,
        caption: photo.caption,
      })),
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

    const serializedCategories = categories.map((cat) => ({
      id: cat.id,
      nama: cat.nama,
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
