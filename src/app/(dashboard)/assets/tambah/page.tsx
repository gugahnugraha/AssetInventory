import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllDistributions } from "@/services/distribution";
import { getAllHolders } from "@/services/holder";
import { getAllCategories } from "@/services/category";
import { getAllKibs } from "@/services/kib";
import { AssetFormClient } from "../AssetFormClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Tambah Aset - SIM Inventaris Aset SKPD",
  description: "Formulir pendaftaran barang inventaris baru.",
};

export default async function AddAssetPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Block Manager (read-only)
  if (session.user.role === Role.MANAGER) {
    redirect("/assets");
  }

  const opdId = session.user.opdId;

  try {
    const [distributions, holders, categories, kibs] = await Promise.all([
      getAllDistributions(opdId),
      getAllHolders(opdId),
      getAllCategories(),
      getAllKibs()
    ]);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
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
        distributions={serializedDistributions}
        holders={serializedHolders}
        categories={serializedCategories}
        kibs={serializedKibs}
        userRole={session.user.role}
      />
    );
  } catch (error) {
    console.error("Failed to load add asset page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal memuat formulir tambah aset. Silakan coba kembali.</p>
      </div>
    );
  }
}
