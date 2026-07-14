import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getPeriodById, getDashboardStats } from "@/services/reconciliation";
import { PeriodeDetailClient } from "./PeriodeDetailClient";
import prisma from "@/services/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PeriodeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const period = await getPeriodById(id);
  if (!period) notFound();

  const stats = await getDashboardStats(id, session.user.opdId);

  // Get total assets for this OPD
  const totalAssets = await prisma.asset.count({ where: { opdId: session.user.opdId } });

  const serialized = {
    ...period,
    tanggalMulai: period.tanggalMulai.toISOString(),
    tanggalSelesai: period.tanggalSelesai.toISOString(),
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
    reconciliations: period.reconciliations.map((r: any) => ({
      ...r,
      checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };

  return (
    <PeriodeDetailClient
      period={serialized}
      stats={stats}
      totalAssets={totalAssets}
      userRole={session.user.role}
    />
  );
}
