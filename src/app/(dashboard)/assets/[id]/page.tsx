import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAssetById } from "@/services/asset";
import { AssetDetailClient } from "./AssetDetailClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Detail Aset - SIM Inventaris Aset OPD",
  description: "Informasi spesifikasi lengkap dan riwayat audit perubahan barang.",
};

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const { id } = await params;
  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;

  try {
    const asset = await getAssetById(id);

    // Security check: Asset must exist and belong to the user's OPD
    if (!asset || asset.opdId !== opdId) {
      notFound();
    }

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedAsset = {
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      distribution: {
        ...asset.distribution,
        createdAt: asset.distribution.createdAt.toISOString(),
        updatedAt: asset.distribution.updatedAt.toISOString(),
      },
      holder: asset.holder
        ? {
            ...asset.holder,
            createdAt: asset.holder.createdAt.toISOString(),
            updatedAt: asset.holder.updatedAt.toISOString(),
          }
        : null,
      photos: asset.photos.map((photo) => ({
        ...photo,
        createdAt: photo.createdAt.toISOString(),
      })),
      auditLogs: asset.auditLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        user: {
          nama: log.user.nama,
          role: log.user.role,
        },
      })),
    };

    return (
      <AssetDetailClient
        asset={serializedAsset}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error("Failed to load asset detail page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil data detail aset. Silakan coba kembali.</p>
      </div>
    );
  }
}
