import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAssetById } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { getAssetReconciliationHistory } from "@/services/reconciliation";
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
      category: {
        ...asset.category,
        createdAt: asset.category.createdAt.toISOString(),
        updatedAt: asset.category.updatedAt.toISOString(),
      },
      attributes: asset.attributes.map((attr) => ({
        ...attr,
        createdAt: attr.createdAt.toISOString(),
        updatedAt: attr.updatedAt.toISOString(),
        categoryAttribute: {
          ...attr.categoryAttribute,
          createdAt: attr.categoryAttribute.createdAt.toISOString(),
          updatedAt: attr.categoryAttribute.updatedAt.toISOString(),
        }
      })),
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
      fotoUtama: DocumentService.generateFileUrl(asset.fotoUtama),
      photos: (asset as any).photos.map((photo: any) => ({
        id: photo.id,
        url: DocumentService.generateFileUrl(photo.objectKey),
        originalFileName: photo.originalFileName,
        mimeType: photo.mimeType,
        size: photo.size,
        isPrimary: photo.isPrimary,
        uploadedAt: photo.uploadedAt.toISOString(),
      })),
      auditLogs: asset.auditLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        user: {
          nama: log.user.nama,
          role: log.user.role,
        },
      })),
      history: (asset as any).history ? (asset as any).history.map((h: any) => ({
        ...h,
        beritaAcaraDate: h.beritaAcaraDate.toISOString(),
        createdAt: h.createdAt.toISOString(),
        creator: {
          nama: h.creator.nama,
          role: h.creator.role,
        },
        fromDistribution: h.fromDistribution ? {
          id: h.fromDistribution.id,
          nama: h.fromDistribution.nama,
        } : null,
        toDistribution: h.toDistribution ? {
          id: h.toDistribution.id,
          nama: h.toDistribution.nama,
        } : null,
        fromHolder: h.fromHolder ? {
          id: h.fromHolder.id,
          nama: h.fromHolder.nama,
          nip: h.fromHolder.nip,
          jabatan: h.fromHolder.jabatan,
        } : null,
        toHolder: h.toHolder ? {
          id: h.toHolder.id,
          nama: h.toHolder.nama,
          nip: h.toHolder.nip,
          jabatan: h.toHolder.jabatan,
        } : null,
        documents: h.documents.map((d: any) => ({
          id: d.id,
          fileName: d.originalFileName,
          fileUrl: DocumentService.generateFileUrl(d.objectKey),
          uploadedAt: d.uploadedAt.toISOString(),
        })),
      })) : [],
    };

    // Fetch reconciliation history for this asset
    const reconHistory = await getAssetReconciliationHistory(id);
    const serializedReconHistory = reconHistory.map((r) => ({
      id: r.id,
      status: r.status,
      notes: r.notes,
      checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      period: r.period,
      checker: r.checker,
      _count: r._count,
    }));

    return (
      <AssetDetailClient
        asset={serializedAsset}
        userRole={userRole}
        reconHistory={serializedReconHistory}
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
