import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/services/asset";
import { getRecentAuditLogs } from "@/services/auditLog";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Dashboard - SIM Inventaris Aset OPD",
  description: "Halaman dashboard analisis kondisi, jenis, dan pemegang aset OPD Kabupaten Bandung.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;

  try {
    // Fetch stats and logs from services
    const stats = await getDashboardStats(opdId);
    const recentLogs = await getRecentAuditLogs(opdId, 5);

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
        }
      })),
    };

    const serializedLogs = recentLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    }));

    return (
      <DashboardClient 
        stats={serializedStats} 
        recentLogs={serializedLogs} 
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
