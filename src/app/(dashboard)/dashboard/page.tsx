import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/services/asset";
import { getRecentAuditLogs } from "@/services/auditLog";
import { getRecentHistories } from "@/services/history";
import { DashboardClient } from "./DashboardClient";
import { getPageTitle } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Dashboard"),
  description: "Ringkasan statistik dan statistik aset SKPD.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;

  try {
    // Fetch stats, logs, and mutations from services
    const stats = await getDashboardStats(opdId);
    const recentLogs = await getRecentAuditLogs(opdId, 5);
    const recentMutations = await getRecentHistories(opdId, 10);

    // Cast Date objects to JSON-friendly string timestamps to avoid hydration issues
    const serializedStats = {
      ...stats,
      latestAssets: stats.latestAssets.map((asset) => ({
        ...asset,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
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
        }
      })),
    };

    const serializedLogs = recentLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    }));

    const serializedMutations = recentMutations.map((m) => ({
      id: m.id,
      mutationType: m.mutationType,
      beritaAcaraNumber: m.beritaAcaraNumber,
      createdAt: m.createdAt.toISOString(),
      asset: {
        namaAset: m.asset.namaAset,
        merkType: m.asset.merkType,
        kodeLengkap: m.asset.kodeLengkap,
      },
      toDistribution: m.toDistribution ? { nama: m.toDistribution.nama } : null,
      toHolder: m.toHolder ? { nama: m.toHolder.nama } : null,
    }));

    return (
      <DashboardClient 
        stats={serializedStats} 
        recentLogs={serializedLogs} 
        recentMutations={serializedMutations}
      />
    );
  } catch (error) {
    console.error("Dashboard page data load failed:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil data statistik dashboard. Silakan periksa koneksi database Anda.</p>
      </div>
    );
  }
}
