import prisma from "./db";
import { MutationType, Kondisi } from "@prisma/client";

export interface CreateHistoryInput {
  assetId: string;
  toDistributionId?: string | null;
  toHolderId?: string | null;
  toCondition?: Kondisi | null;
  beritaAcaraNumber: string;
  beritaAcaraDate: Date;
  description?: string | null;
  createdBy: string;
  document?: {
    fileName: string;
    fileUrl: string;
  } | null;
}

/**
 * Perform asset mutation/transfer and save history in a transaction
 */
export async function createAssetHistory(data: CreateHistoryInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get current asset state
      const asset = await tx.asset.findUnique({
        where: { id: data.assetId },
        include: {
          distribution: true,
          holder: true,
        }
      });

      if (!asset) {
        throw new Error("Aset tidak ditemukan.");
      }

      const fromHolderId = asset.holderId;
      const fromDistributionId = asset.distributionId;
      const fromCondition = asset.kondisi;

      // Determine new values, fallback to current if not provided
      const toHolderId = data.toHolderId !== undefined ? data.toHolderId : fromHolderId;
      const toDistributionId = data.toDistributionId !== undefined && data.toDistributionId !== null ? data.toDistributionId : fromDistributionId;
      const toCondition = data.toCondition !== undefined && data.toCondition !== null ? data.toCondition : fromCondition;

      const holderChanged = fromHolderId !== toHolderId;
      const distributionChanged = fromDistributionId !== toDistributionId;
      const conditionChanged = fromCondition !== toCondition;

      if (!holderChanged && !distributionChanged && !conditionChanged) {
        throw new Error("Tidak ada perubahan bidang penempatan, pemegang barang, maupun kondisi aset.");
      }

      // Determine mutation type
      let mutationType: MutationType;
      let changeCount = 0;
      if (holderChanged) changeCount++;
      if (distributionChanged) changeCount++;
      if (conditionChanged) changeCount++;

      if (changeCount > 1) {
        mutationType = MutationType.MULTIPLE;
      } else if (holderChanged) {
        mutationType = MutationType.HOLDER;
      } else if (distributionChanged) {
        mutationType = MutationType.DISTRIBUTION;
      } else {
        mutationType = MutationType.CONDITION;
      }

      // 2. Create AssetHistory record
      const historyRecord = await tx.assetHistory.create({
        data: {
          assetId: data.assetId,
          mutationType,
          fromHolderId,
          toHolderId,
          fromDistributionId,
          toDistributionId,
          fromCondition,
          toCondition,
          beritaAcaraNumber: data.beritaAcaraNumber,
          beritaAcaraDate: data.beritaAcaraDate,
          description: data.description || null,
          createdBy: data.createdBy,
        },
      });

      // 3. Create document if provided
      if (data.document) {
        await tx.assetHistoryDocument.create({
          data: {
            assetHistoryId: historyRecord.id,
            fileName: data.document.fileName,
            fileUrl: data.document.fileUrl,
          },
        });
      }

      // 4. Update Asset table
      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          distributionId: toDistributionId,
          holderId: toHolderId,
          kondisi: toCondition,
        },
      });

      // 5. Create system-wide Activity Audit Log
      await tx.auditLog.create({
        data: {
          userId: data.createdBy,
          assetId: data.assetId,
          action: "UPDATE",
          oldValue: JSON.stringify({
            distributionId: fromDistributionId,
            holderId: fromHolderId,
            kondisi: fromCondition,
          }),
          newValue: JSON.stringify({
            distributionId: toDistributionId,
            holderId: toHolderId,
            kondisi: toCondition,
          }),
        },
      });

      return historyRecord;
    });
  } catch (error: any) {
    console.error("Error in createAssetHistory service:", error);
    throw new Error(error.message || "Gagal memproses mutasi aset.");
  }
}

/**
 * Get mutation history for a specific asset (append-only, chronological)
 */
export async function getHistoryByAssetId(assetId: string) {
  try {
    return await prisma.assetHistory.findMany({
      where: { assetId },
      include: {
        fromDistribution: true,
        toDistribution: true,
        fromHolder: true,
        toHolder: true,
        creator: {
          select: {
            nama: true,
            role: true,
          },
        },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error in getHistoryByAssetId:", error);
    throw new Error("Gagal mengambil riwayat mutasi aset.");
  }
}

/**
 * Get all mutation histories for an OPD
 */
export async function getAllHistories(opdId: string) {
  try {
    return await prisma.assetHistory.findMany({
      where: {
        asset: {
          opdId,
        },
      },
      include: {
        asset: {
          select: {
            namaAset: true,
            merkType: true,
            kodeLengkap: true,
          },
        },
        fromDistribution: true,
        toDistribution: true,
        fromHolder: true,
        toHolder: true,
        creator: {
          select: {
            nama: true,
            role: true,
          },
        },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error in getAllHistories:", error);
    throw new Error("Gagal mengambil riwayat mutasi aset.");
  }
}

/**
 * Get recent histories (mutations) for dashboard
 */
export async function getRecentHistories(opdId: string, limit = 10) {
  try {
    return await prisma.assetHistory.findMany({
      where: {
        asset: {
          opdId,
        },
      },
      include: {
        asset: {
          select: {
            namaAset: true,
            merkType: true,
            kodeLengkap: true,
          },
        },
        toDistribution: {
          select: {
            nama: true,
          },
        },
        toHolder: {
          select: {
            nama: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error in getRecentHistories:", error);
    throw new Error("Gagal mengambil log mutasi terbaru.");
  }
}
