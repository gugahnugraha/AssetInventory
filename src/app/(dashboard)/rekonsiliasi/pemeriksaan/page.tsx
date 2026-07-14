import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPeriodsByOpd } from "@/services/reconciliation";
import { PemeriksaanClient } from "./PemeriksaanClient";
import prisma from "@/services/db";

export default async function PemeriksaanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const opdId = session.user.opdId;

  // Get active (OPEN) periods
  const periods = await getPeriodsByOpd(opdId);
  const openPeriods = periods.filter((p) => p.status === "OPEN");

  // Get all assets with their rekon status in the active period
  const activePeriod = openPeriods[0] || null;

  let assets: any[] = [];
  let reconStatusMap: Record<string, { status: string; reconId: string | null }> = {};

  if (activePeriod) {
    assets = await prisma.asset.findMany({
      where: { opdId },
      include: {
        category: { select: { nama: true } },
        distribution: { select: { nama: true } },
        holder: { select: { nama: true } },
        reconciliations: {
          where: { periodId: activePeriod.id },
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { namaAset: "asc" },
    });

    reconStatusMap = assets.reduce((acc: any, a: any) => {
      const r = a.reconciliations[0];
      acc[a.id] = {
        status: r?.status ?? "BELUM_DIREKON",
        reconId: r?.id ?? null,
      };
      return acc;
    }, {});
  }

  const serializedAssets = assets.map((a: any) => ({
    id: a.id,
    namaAset: a.namaAset,
    kodeLengkap: a.kodeLengkap,
    merkType: a.merkType,
    kondisi: a.kondisi,
    fotoUtama: a.fotoUtama,
    tahunPembelian: a.tahunPembelian,
    category: a.category,
    distribution: a.distribution,
    holder: a.holder,
  }));

  const serializedPeriod = activePeriod
    ? {
        ...activePeriod,
        tanggalMulai: activePeriod.tanggalMulai.toISOString(),
        tanggalSelesai: activePeriod.tanggalSelesai.toISOString(),
        createdAt: activePeriod.createdAt.toISOString(),
        updatedAt: activePeriod.updatedAt.toISOString(),
      }
    : null;

  return (
    <PemeriksaanClient
      assets={serializedAssets}
      activePeriod={serializedPeriod}
      reconStatusMap={reconStatusMap}
      userRole={session.user.role}
    />
  );
}
