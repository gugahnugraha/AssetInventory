"use server";

import { auth } from "@/auth";
import prisma from "@/services/db";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/services/auditLog";

// Helper to convert date strings in objects to Date instances
const parseDates = (obj: any, dateFields: string[]) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  for (const field of dateFields) {
    if (newObj[field]) {
      newObj[field] = new Date(newObj[field]);
    }
  }
  return newObj;
};

export async function exportBackupAction() {
  const session = await auth();
  if (!session || !session.user) {
    return { error: "Anda harus masuk terlebih dahulu." };
  }
  if (session.user.role === Role.DEMO) {
    return { error: "Demo Only: Anda tidak diizinkan melakukan perubahan." };
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat mengekspor cadangan data." };
  }

  try {
    // Query all tables in correct order
    const opd = await prisma.opd.findMany();
    const user = await prisma.user.findMany();
    const distribution = await prisma.distribution.findMany();
    const holder = await prisma.holder.findMany();
    const kib = await prisma.kib.findMany();
    const category = await prisma.category.findMany();
    const categoryAttribute = await prisma.categoryAttribute.findMany();
    const asset = await prisma.asset.findMany();
    const assetAttribute = await prisma.assetAttribute.findMany();
    const document = await prisma.document.findMany();
    const auditLog = await prisma.auditLog.findMany();
    const assetHistory = await prisma.assetHistory.findMany();
    const reconciliationPeriod = await prisma.reconciliationPeriod.findMany();
    const assetReconciliation = await prisma.assetReconciliation.findMany();
    const assetReconciliationChecklist = await prisma.assetReconciliationChecklist.findMany();
    const reconciliationFinding = await prisma.reconciliationFinding.findMany();

    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      exportedBy: session.user.nama || session.user.username || "System",
      tables: {
        opd,
        user,
        distribution,
        holder,
        kib,
        category,
        categoryAttribute,
        asset,
        assetAttribute,
        document,
        auditLog,
        assetHistory,
        reconciliationPeriod,
        assetReconciliation,
        assetReconciliationChecklist,
        reconciliationFinding,
      }
    };

    // Log the backup export activity
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      newValue: JSON.stringify({ activity: "SYSTEM_BACKUP_EXPORT", timestamp: backupData.timestamp })
    });

    return { success: true, backupData };
  } catch (error: any) {
    console.error("Backup export error:", error);
    return { error: `Gagal mengekspor data: ${error.message || String(error)}` };
  }
}

export async function importBackupAction(jsonDataStr: string) {
  const session = await auth();
  if (!session || !session.user) {
    return { error: "Anda harus masuk terlebih dahulu." };
  }
  if (session.user.role === Role.DEMO) {
    return { error: "Demo Only: Anda tidak diizinkan melakukan perubahan." };
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat memulihkan data." };
  }

  try {
    const backup = JSON.parse(jsonDataStr);
    
    // Simple structural validation
    if (!backup.version || !backup.tables) {
      return { error: "Berkas cadangan tidak valid: Format berkas tidak dikenali." };
    }

    const {
      opd,
      user,
      distribution,
      holder,
      kib,
      category,
      categoryAttribute,
      asset,
      assetAttribute,
      document,
      auditLog,
      assetHistory,
      reconciliationPeriod,
      assetReconciliation,
      assetReconciliationChecklist,
      reconciliationFinding,
    } = backup.tables;

    // Validate that required tables exist in backup
    if (!opd || !user) {
      return { error: "Berkas cadangan tidak lengkap: Tabel data instansi atau pengguna hilang." };
    }

    // Convert date strings back to Date objects where needed
    const parsedOpd = opd.map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedUser = user.map((x: any) => parseDates(x, ["lastLogin", "createdAt", "updatedAt"]));
    const parsedDistribution = (distribution || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedHolder = (holder || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedKib = (kib || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedCategory = (category || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedCategoryAttribute = (categoryAttribute || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedAsset = (asset || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedAssetAttribute = (assetAttribute || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedDocument = (document || []).map((x: any) => parseDates(x, ["uploadedAt", "archivedAt"]));
    const parsedAuditLog = (auditLog || []).map((x: any) => parseDates(x, ["createdAt"]));
    const parsedAssetHistory = (assetHistory || []).map((x: any) => parseDates(x, ["beritaAcaraDate", "createdAt"]));
    const parsedReconciliationPeriod = (reconciliationPeriod || []).map((x: any) => parseDates(x, ["tanggalMulai", "tanggalSelesai", "createdAt", "updatedAt"]));
    const parsedAssetReconciliation = (assetReconciliation || []).map((x: any) => parseDates(x, ["checkedAt", "createdAt", "updatedAt"]));
    const parsedAssetReconciliationChecklist = (assetReconciliationChecklist || []).map((x: any) => parseDates(x, ["createdAt", "updatedAt"]));
    const parsedReconciliationFinding = (reconciliationFinding || []).map((x: any) => parseDates(x, ["resolvedAt", "createdAt", "updatedAt"]));

    // Execute import in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all records in reverse dependency order
      await tx.reconciliationFinding.deleteMany();
      await tx.assetReconciliationChecklist.deleteMany();
      await tx.assetReconciliation.deleteMany();
      await tx.reconciliationPeriod.deleteMany();
      await tx.assetAttribute.deleteMany();
      await tx.assetHistory.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.document.deleteMany();
      await tx.asset.deleteMany();
      await tx.categoryAttribute.deleteMany();
      await tx.category.deleteMany();
      await tx.kib.deleteMany();
      await tx.holder.deleteMany();
      await tx.distribution.deleteMany();
      await tx.user.deleteMany();
      await tx.opd.deleteMany();

      // 2. Insert records in dependency order
      if (parsedOpd.length) await tx.opd.createMany({ data: parsedOpd });
      if (parsedUser.length) await tx.user.createMany({ data: parsedUser });
      if (parsedDistribution.length) await tx.distribution.createMany({ data: parsedDistribution });
      if (parsedHolder.length) await tx.holder.createMany({ data: parsedHolder });
      if (parsedKib.length) await tx.kib.createMany({ data: parsedKib });
      if (parsedCategory.length) await tx.category.createMany({ data: parsedCategory });
      if (parsedCategoryAttribute.length) await tx.categoryAttribute.createMany({ data: parsedCategoryAttribute });
      if (parsedAsset.length) await tx.asset.createMany({ data: parsedAsset });
      if (parsedAssetAttribute.length) await tx.assetAttribute.createMany({ data: parsedAssetAttribute });
      if (parsedDocument.length) await tx.document.createMany({ data: parsedDocument });
      if (parsedAuditLog.length) await tx.auditLog.createMany({ data: parsedAuditLog });
      if (parsedAssetHistory.length) await tx.assetHistory.createMany({ data: parsedAssetHistory });
      if (parsedReconciliationPeriod.length) await tx.reconciliationPeriod.createMany({ data: parsedReconciliationPeriod });
      if (parsedAssetReconciliation.length) await tx.assetReconciliation.createMany({ data: parsedAssetReconciliation });
      if (parsedAssetReconciliationChecklist.length) await tx.assetReconciliationChecklist.createMany({ data: parsedAssetReconciliationChecklist });
      if (parsedReconciliationFinding.length) await tx.reconciliationFinding.createMany({ data: parsedReconciliationFinding });
    });

    // Write audit log outside transaction just in case
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      newValue: JSON.stringify({ activity: "SYSTEM_BACKUP_RESTORE", backupTimestamp: backup.timestamp })
    });

    return { success: true };
  } catch (error: any) {
    console.error("Backup import error:", error);
    return { error: `Gagal memulihkan data: ${error.message || String(error)}` };
  }
}
