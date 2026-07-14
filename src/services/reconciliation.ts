import prisma from "./db";
import {
  ReconciliationStatus,
  AssetReconciliationStatus,
  FindingType,
  FindingSeverity,
  FindingRecommendation,
} from "@prisma/client";

// 9 Default checklist items
export const DEFAULT_CHECKLIST_ITEMS = [
  "Barang ditemukan di lokasi",
  "Label inventaris masih terpasang",
  "Foto aset terbaru tersedia",
  "Kondisi aset sesuai dengan data",
  "Pemegang Barang sesuai dengan data",
  "Distribusi/Bidang sesuai dengan data",
  "Dokumen pengadaan tersedia",
  "Berita Acara serah terima lengkap",
  "Atribut dan spesifikasi aset sesuai",
];

// =============================================
// PERIOD MANAGEMENT
// =============================================

export interface CreatePeriodInput {
  nama: string;
  triwulan: number;
  tahun: number;
  tanggalMulai: Date | string;
  tanggalSelesai: Date | string;
}

export async function createPeriod(
  data: CreatePeriodInput,
  userId: string,
  opdId: string
) {
  const period = await prisma.reconciliationPeriod.create({
    data: {
      nama: data.nama,
      triwulan: data.triwulan,
      tahun: data.tahun,
      tanggalMulai: new Date(data.tanggalMulai),
      tanggalSelesai: new Date(data.tanggalSelesai),
      status: ReconciliationStatus.OPEN,
      opdId,
      createdBy: userId,
    },
  });

  // Log
  await prisma.auditLog.create({
    data: {
      userId,
      assetId: period.id, // repurpose for period id; fine for now
      action: "CREATE_REKON_PERIOD",
      newValue: JSON.stringify({ nama: data.nama, tahun: data.tahun }),
    },
  });

  return period;
}

export async function getPeriodsByOpd(opdId: string) {
  return prisma.reconciliationPeriod.findMany({
    where: { opdId },
    orderBy: [{ tahun: "desc" }, { triwulan: "desc" }],
    include: {
      creator: { select: { nama: true } },
      _count: { select: { reconciliations: true } },
    },
  });
}

export async function getPeriodById(id: string) {
  return prisma.reconciliationPeriod.findUnique({
    where: { id },
    include: {
      creator: { select: { nama: true, username: true } },
      reconciliations: {
        include: {
          asset: {
            select: {
              id: true,
              kodeLengkap: true,
              namaAset: true,
              kondisi: true,
              fotoUtama: true,
              distribution: { select: { nama: true } },
              holder: { select: { nama: true } },
            },
          },
          checker: { select: { nama: true } },
          _count: { select: { findings: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function lockPeriod(id: string, userId: string) {
  const period = await prisma.reconciliationPeriod.update({
    where: { id },
    data: { status: ReconciliationStatus.LOCKED },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      assetId: id,
      action: "LOCK_REKON_PERIOD",
      newValue: JSON.stringify({ periodId: id, status: "LOCKED" }),
    },
  });

  return period;
}

export async function closePeriod(id: string, userId: string) {
  const period = await prisma.reconciliationPeriod.update({
    where: { id },
    data: { status: ReconciliationStatus.CLOSED },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      assetId: id,
      action: "CLOSE_REKON_PERIOD",
      newValue: JSON.stringify({ periodId: id, status: "CLOSED" }),
    },
  });

  return period;
}

// =============================================
// ASSET RECONCILIATION
// =============================================

export async function startAssetReconciliation(
  periodId: string,
  assetId: string,
  userId: string
) {
  // Check if already exists
  const existing = await prisma.assetReconciliation.findUnique({
    where: { periodId_assetId: { periodId, assetId } },
    include: { checklists: true, findings: true },
  });

  if (existing) return existing;

  // Create reconciliation + 9 default checklists in transaction
  return prisma.$transaction(async (tx) => {
    const recon = await tx.assetReconciliation.create({
      data: {
        periodId,
        assetId,
        status: AssetReconciliationStatus.BELUM_DIREKON,
        checkedBy: userId,
      },
    });

    await tx.assetReconciliationChecklist.createMany({
      data: DEFAULT_CHECKLIST_ITEMS.map((item) => ({
        assetReconciliationId: recon.id,
        checklistItem: item,
        checked: false,
      })),
    });

    await tx.auditLog.create({
      data: {
        userId,
        assetId,
        action: "START_REKONSILIASI",
        newValue: JSON.stringify({ periodId, reconId: recon.id }),
      },
    });

    return tx.assetReconciliation.findUnique({
      where: { id: recon.id },
      include: { checklists: true, findings: true },
    });
  });
}

export interface ChecklistData {
  id: string;
  checked: boolean;
  notes?: string;
}

export async function saveAssetReconciliation(
  reconId: string,
  checklistData: ChecklistData[],
  notes: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    // Update each checklist item
    for (const item of checklistData) {
      await tx.assetReconciliationChecklist.update({
        where: { id: item.id },
        data: { checked: item.checked, notes: item.notes || null },
      });
    }

    // Determine auto-status based on checklists
    const allChecked = checklistData.every((c) => c.checked);
    const status = allChecked
      ? AssetReconciliationStatus.SESUAI
      : AssetReconciliationStatus.TIDAK_SESUAI;

    const recon = await tx.assetReconciliation.update({
      where: { id: reconId },
      data: {
        status,
        notes,
        checkedBy: userId,
        checkedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        assetId: recon.assetId,
        action: "SAVE_REKONSILIASI",
        newValue: JSON.stringify({ reconId, status, notes }),
      },
    });

    return recon;
  });
}

export async function getAssetReconciliation(reconId: string) {
  return prisma.assetReconciliation.findUnique({
    where: { id: reconId },
    include: {
      asset: {
        include: {
          category: true,
          distribution: true,
          holder: true,
          attributes: { include: { categoryAttribute: true } },
          history: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              fromHolder: { select: { nama: true } },
              toHolder: { select: { nama: true } },
              fromDistribution: { select: { nama: true } },
              toDistribution: { select: { nama: true } },
              creator: { select: { nama: true } },
            },
          },
        },
      },
      period: true,
      checker: { select: { nama: true, username: true } },
      checklists: { orderBy: { createdAt: "asc" } },
      findings: { orderBy: { createdAt: "desc" } },
    },
  });
}

// =============================================
// FINDINGS
// =============================================

export interface CreateFindingInput {
  findingType: FindingType;
  severity: FindingSeverity;
  description: string;
  recommendation: FindingRecommendation;
}

export async function addFinding(
  reconId: string,
  data: CreateFindingInput,
  userId: string
) {
  const recon = await prisma.assetReconciliation.findUnique({ where: { id: reconId } });
  if (!recon) throw new Error("Rekonsiliasi tidak ditemukan.");

  const finding = await prisma.reconciliationFinding.create({
    data: {
      assetReconciliationId: reconId,
      findingType: data.findingType,
      severity: data.severity,
      description: data.description,
      recommendation: data.recommendation,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      assetId: recon.assetId,
      action: "ADD_FINDING",
      newValue: JSON.stringify({ reconId, findingType: data.findingType, severity: data.severity }),
    },
  });

  return finding;
}

export async function resolveFinding(findingId: string, userId: string) {
  const finding = await prisma.reconciliationFinding.findUnique({
    where: { id: findingId },
    include: { reconciliation: true },
  });
  if (!finding) throw new Error("Temuan tidak ditemukan.");

  const updated = await prisma.reconciliationFinding.update({
    where: { id: findingId },
    data: { resolved: true, resolvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      assetId: finding.reconciliation.assetId,
      action: "RESOLVE_FINDING",
      newValue: JSON.stringify({ findingId }),
    },
  });

  return updated;
}

// =============================================
// DASHBOARD STATS
// =============================================

export async function getDashboardStats(periodId: string, opdId: string) {
  const [totalAssets, reconciliations, findings] = await Promise.all([
    prisma.asset.count({ where: { opdId } }),
    prisma.assetReconciliation.findMany({
      where: { periodId },
      select: { status: true },
    }),
    prisma.reconciliationFinding.findMany({
      where: {
        reconciliation: { periodId },
        severity: "CRITICAL",
        resolved: false,
      },
      select: { id: true },
    }),
  ]);

  const sesuai = reconciliations.filter((r) => r.status === "SESUAI").length;
  const tidakSesuai = reconciliations.filter((r) => r.status === "TIDAK_SESUAI").length;
  const total = reconciliations.length;
  const belum = totalAssets - total;

  return {
    totalAssets,
    totalRekon: total,
    belumDirekon: belum,
    sesuai,
    tidakSesuai,
    progress: totalAssets > 0 ? Math.round((total / totalAssets) * 100) : 0,
    criticalFindings: findings.length,
  };
}

export async function getRecentReconciliations(periodId: string, limit = 10) {
  return prisma.assetReconciliation.findMany({
    where: { periodId },
    orderBy: { checkedAt: "desc" },
    take: limit,
    include: {
      asset: { select: { namaAset: true, kodeLengkap: true } },
      checker: { select: { nama: true } },
      _count: { select: { findings: true } },
    },
  });
}

export async function getRecentFindings(periodId: string, limit = 10) {
  return prisma.reconciliationFinding.findMany({
    where: { reconciliation: { periodId }, resolved: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      reconciliation: {
        include: {
          asset: { select: { namaAset: true, kodeLengkap: true } },
        },
      },
    },
  });
}

// =============================================
// ASSET RECONCILIATION HISTORY
// =============================================

export async function getAssetReconciliationHistory(assetId: string) {
  return prisma.assetReconciliation.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    include: {
      period: { select: { nama: true, triwulan: true, tahun: true } },
      checker: { select: { nama: true } },
      _count: { select: { findings: true } },
    },
  });
}

// =============================================
// REPORT DATA
// =============================================

export async function generateReportData(periodId: string, opdId: string) {
  const [period, stats, recentRecons, byDistribution, byCategory] = await Promise.all([
    prisma.reconciliationPeriod.findUnique({
      where: { id: periodId },
      include: { creator: { select: { nama: true } } },
    }),
    getDashboardStats(periodId, opdId),
    prisma.assetReconciliation.findMany({
      where: { periodId },
      include: {
        asset: {
          include: {
            distribution: { select: { nama: true } },
            category: { select: { nama: true } },
            holder: { select: { nama: true } },
          },
        },
        checker: { select: { nama: true } },
        findings: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    // Findings grouped by distribution
    prisma.reconciliationFinding.groupBy({
      by: ["findingType"],
      where: { reconciliation: { periodId } },
      _count: true,
    }),
    prisma.reconciliationFinding.groupBy({
      by: ["severity"],
      where: { reconciliation: { periodId } },
      _count: true,
    }),
  ]);

  // Assets not yet reconciled
  const reconciledAssetIds = recentRecons.map((r) => r.assetId);
  const belumDirekonAssets = await prisma.asset.findMany({
    where: {
      opdId,
      id: { notIn: reconciledAssetIds },
    },
    include: {
      distribution: { select: { nama: true } },
      holder: { select: { nama: true } },
      category: { select: { nama: true } },
    },
    orderBy: { namaAset: "asc" },
  });

  return {
    period,
    stats,
    reconciliations: recentRecons,
    belumDirekonAssets,
    findingsByType: byDistribution,
    findingsBySeverity: byCategory,
  };
}

// =============================================
// LIST ALL FINDINGS
// =============================================

export async function getAllFindings(opdId: string, periodId?: string) {
  return prisma.reconciliationFinding.findMany({
    where: {
      reconciliation: {
        periodId: periodId || undefined,
        period: { opdId },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      reconciliation: {
        include: {
          asset: { select: { namaAset: true, kodeLengkap: true, distribution: { select: { nama: true } } } },
          period: { select: { nama: true, tahun: true, triwulan: true } },
          checker: { select: { nama: true } },
        },
      },
    },
  });
}

// =============================================
// GET ALL ASSETS WITH REKON STATUS (for filter)
// =============================================

export async function getAssetsWithRekonStatus(periodId: string, opdId: string) {
  const assets = await prisma.asset.findMany({
    where: { opdId },
    select: {
      id: true,
      reconciliations: {
        where: { periodId },
        select: { status: true },
        take: 1,
      },
    },
  });

  return assets.reduce(
    (acc, a) => {
      const status = a.reconciliations[0]?.status ?? "BELUM_DIREKON";
      acc[a.id] = status;
      return acc;
    },
    {} as Record<string, string>
  );
}
