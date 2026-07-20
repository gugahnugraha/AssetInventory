import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllHistories } from "@/services/history";
import { getAllAssets } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { getAllDistributions } from "@/services/distribution";
import { getAllHolders } from "@/services/holder";
import { MutasiClient } from "./MutasiClient";
import { Role } from "@prisma/client";
import { getPageTitle } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Mutasi Aset"),
  description: "Riwayat perpindahan dan mutasi penanggung jawab aset SKPD.",
};

interface MutasiPageProps {
  searchParams: Promise<{ assetId?: string }>;
}

export default async function MutasiPage({ searchParams }: MutasiPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;
  const { assetId } = await searchParams;

  try {
    const histories = await getAllHistories(opdId);
    const assets = await getAllAssets(opdId);
    const distributions = await getAllDistributions(opdId);
    const holders = await getAllHolders(opdId);

    // Serialize database models (date conversion to ISO strings)
    const serializedHistories = histories.map((h) => ({
      id: h.id,
      assetId: h.assetId,
      mutationType: h.mutationType,
      beritaAcaraNumber: h.beritaAcaraNumber,
      beritaAcaraDate: h.beritaAcaraDate.toISOString(),
      description: h.description,
      createdAt: h.createdAt.toISOString(),
      fromCondition: h.fromCondition,
      toCondition: h.toCondition,
      creator: {
        nama: h.creator.nama,
        role: h.creator.role,
      },
      asset: {
        namaAset: h.asset.namaAset,
        merkType: h.asset.merkType,
        kodeLengkap: h.asset.kodeLengkap,
      },
      fromDistribution: h.fromDistribution ? { nama: h.fromDistribution.nama } : null,
      toDistribution: h.toDistribution ? { nama: h.toDistribution.nama } : null,
      fromHolder: h.fromHolder ? { nama: h.fromHolder.nama } : null,
      toHolder: h.toHolder ? { nama: h.toHolder.nama } : null,
      documents: h.documents.map((doc) => ({
        fileName: doc.originalFileName,
        fileUrl: DocumentService.generateFileUrl(doc.objectKey),
      })),
    }));

    const serializedAssets = assets.map((a) => ({
      id: a.id,
      namaAset: a.namaAset,
      merkType: a.merkType,
      kodeLengkap: a.kodeLengkap,
      distributionId: a.distributionId,
      distributionName: a.distribution.nama,
      holderId: a.holderId,
      holderName: a.holder?.nama || null,
      kondisi: a.kondisi,
    }));

    const serializedDistributions = distributions.map((d) => ({
      id: d.id,
      nama: d.nama,
    }));

    const serializedHolders = holders.map((h) => ({
      id: h.id,
      nama: h.nama,
      distributionId: h.distributionId,
      jabatan: h.jabatan,
    }));

    return (
      <MutasiClient
        histories={serializedHistories}
        assets={serializedAssets}
        distributions={serializedDistributions}
        holders={serializedHolders}
        userRole={userRole}
        preselectedAssetId={assetId}
      />
    );
  } catch (error) {
    console.error("Failed to load mutasi page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal memuat data mutasi aset. Silakan coba kembali.</p>
      </div>
    );
  }
}
