import prisma from "./db";

export interface CreateAuditLogInput {
  userId: string;
  assetId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  oldValue?: string;
  newValue?: string;
}

export async function createAuditLog(data: CreateAuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        assetId: data.assetId,
        action: data.action,
        oldValue: data.oldValue,
        newValue: data.newValue,
      },
    });
  } catch (error) {
    console.error("Error in createAuditLog:", error);
    // Silent fail or warning so it doesn't block the main asset operations if logging has issues
    console.warn("Gagal mencatat log audit");
  }
}

export async function getAuditLogsForAsset(assetId: string) {
  try {
    return await prisma.auditLog.findMany({
      where: { assetId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error in getAuditLogsForAsset:", error);
    throw new Error("Gagal mengambil log audit untuk aset ini");
  }
}

export async function getRecentAuditLogs(opdId: string, limit = 10) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        asset: {
          opdId,
        },
      },
      include: {
        user: {
          select: {
            nama: true,
            role: true,
          },
        },
        asset: {
          select: {
            kodeLengkap: true,
            namaAset: true,
            merkType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error in getRecentAuditLogs:", error);
    throw new Error("Gagal mengambil log audit terbaru");
  }
}
