import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllAssets } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { PenghapusanClient } from "./PenghapusanClient";
import { Role } from "@prisma/client";
import { getPageTitle } from "@/lib/constants";

import prisma from "@/services/db";
import { DEFAULT_OPD_NAME } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Penghapusan Aset"),
  description: "Alur penyerahan aset rusak berat untuk penghapusan.",
};

export default async function PenghapusanPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;

  try {
    const opd = await prisma.opd.findUnique({
      where: { id: opdId },
    });
    const opdName = opd?.nama || session.user.opdName || DEFAULT_OPD_NAME;

    // We can fetch all assets so they can search, or only RUSAK_BERAT. 
    // We will fetch all assets and let the client filter if needed, 
    // or just fetch all so they have flexibility.
    const assets = await getAllAssets(opdId);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedAssets = assets.map((asset) => ({
      ...asset,
      opd: asset.opd ? {
        ...asset.opd,
        createdAt: asset.opd.createdAt.toISOString(),
        updatedAt: asset.opd.updatedAt.toISOString(),
      } : null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      fotoUtama: DocumentService.generateFileUrl(asset.fotoUtama),
      category: {
        ...asset.category,
        createdAt: asset.category.createdAt.toISOString(),
        updatedAt: asset.category.updatedAt.toISOString(),
        kib: asset.category.kib
          ? {
              ...asset.category.kib,
              createdAt: asset.category.kib.createdAt.toISOString(),
              updatedAt: asset.category.kib.updatedAt.toISOString(),
            }
          : null,
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
      distribution: asset.distribution ? {
        ...asset.distribution,
        createdAt: asset.distribution.createdAt.toISOString(),
        updatedAt: asset.distribution.updatedAt.toISOString(),
      } : null,
      holder: asset.holder ? {
        ...asset.holder,
        createdAt: asset.holder.createdAt.toISOString(),
        updatedAt: asset.holder.updatedAt.toISOString(),
      } : null,
      reconciliations: ((asset as any).reconciliations || []).map((r: any) => ({
        ...r,
        checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        period: r.period ? {
          ...r.period,
          tanggalMulai: r.period.tanggalMulai.toISOString(),
          tanggalSelesai: r.period.tanggalSelesai.toISOString(),
          createdAt: r.period.createdAt.toISOString(),
          updatedAt: r.period.updatedAt.toISOString(),
        } : null,
      }))
    }));

    return (
      <PenghapusanClient
        initialAssets={serializedAssets}
        userRole={userRole}
        opdName={opdName}
      />
    );
  } catch (error) {
    console.error("Failed to load penghapusan assets:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-600">Gagal memuat data aset. Silakan coba beberapa saat lagi.</p>
      </div>
    );
  }
}
