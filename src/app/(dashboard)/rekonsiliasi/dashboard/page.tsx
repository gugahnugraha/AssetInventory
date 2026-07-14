import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getRecentReconciliations, getRecentFindings, getPeriodsByOpd } from "@/services/reconciliation";
import { DashboardRekonClient } from "./DashboardRekonClient";
import prisma from "@/services/db";

export default async function DashboardRekonPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const opdId = session.user.opdId;

  // Get latest OPEN period if any
  const periods = await getPeriodsByOpd(opdId);
  const activePeriod = periods.find((p) => p.status === "OPEN") || periods[0] || null;

  let stats = { totalAssets: 0, totalRekon: 0, belumDirekon: 0, sesuai: 0, tidakSesuai: 0, progress: 0, criticalFindings: 0 };
  let recentRecons: any[] = [];
  let recentFindings: any[] = [];

  if (activePeriod) {
    [stats, recentRecons, recentFindings] = await Promise.all([
      getDashboardStats(activePeriod.id, opdId),
      getRecentReconciliations(activePeriod.id, 10),
      getRecentFindings(activePeriod.id, 10),
    ]);
  }

  const serializedRecons = recentRecons.map((r) => ({
    ...r,
    checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedFindings = recentFindings.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    reconciliation: {
      ...f.reconciliation,
      createdAt: f.reconciliation.createdAt.toISOString(),
      updatedAt: f.reconciliation.updatedAt.toISOString(),
    },
  }));

  const serializedPeriods = periods.map((p) => ({
    ...p,
    tanggalMulai: p.tanggalMulai.toISOString(),
    tanggalSelesai: p.tanggalSelesai.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <DashboardRekonClient
      stats={stats}
      recentRecons={serializedRecons}
      recentFindings={serializedFindings}
      activePeriod={activePeriod ? serializedPeriods[0] : null}
      periods={serializedPeriods}
      userRole={session.user.role}
    />
  );
}
