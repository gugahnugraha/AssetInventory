"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Role, FindingType, FindingSeverity, FindingRecommendation } from "@prisma/client";
import {
  createPeriod,
  lockPeriod,
  closePeriod,
  startAssetReconciliation,
  saveAssetReconciliation,
  addFinding,
  resolveFinding,
  CreatePeriodInput,
  ChecklistData,
  CreateFindingInput,
} from "@/services/reconciliation";

// Guard functions
async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Anda harus masuk terlebih dahulu.");
  return session;
}

async function requireWriteAccess() {
  const session = await requireAuth();
  if (session.user.role === Role.DEMO) {
    throw new Error("Demo Only: Anda tidak diizinkan melakukan perubahan.");
  }
  if (session.user.role === Role.MANAGER) {
    throw new Error("Akses ditolak. Manager hanya dapat membaca data.");
  }
  return session;
}

async function requireAdminAccess() {
  const session = await requireAuth();
  if (session.user.role === Role.DEMO) {
    throw new Error("Demo Only: Anda tidak diizinkan melakukan perubahan.");
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    throw new Error("Akses ditolak. Hanya Administrator yang dapat melakukan tindakan ini.");
  }
  return session;
}

// =============================================
// PERIOD ACTIONS
// =============================================

export async function createPeriodAction(data: CreatePeriodInput) {
  try {
    const session = await requireAdminAccess();
    const period = await createPeriod(data, session.user.id, session.user.opdId);
    revalidatePath("/rekonsiliasi");
    revalidatePath("/rekonsiliasi/periode");
    revalidatePath("/rekonsiliasi/dashboard");
    return { success: true, data: { id: period.id } };
  } catch (error: any) {
    console.error("Error in createPeriodAction:", error);
    return { error: error.message || "Gagal membuat periode rekonsiliasi." };
  }
}

export async function lockPeriodAction(periodId: string) {
  try {
    const session = await requireAdminAccess();
    await lockPeriod(periodId, session.user.id);
    revalidatePath("/rekonsiliasi/periode");
    revalidatePath(`/rekonsiliasi/periode/${periodId}`);
    revalidatePath("/rekonsiliasi/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in lockPeriodAction:", error);
    return { error: error.message || "Gagal mengunci periode." };
  }
}

export async function closePeriodAction(periodId: string) {
  try {
    const session = await requireAdminAccess();
    await closePeriod(periodId, session.user.id);
    revalidatePath("/rekonsiliasi/periode");
    revalidatePath(`/rekonsiliasi/periode/${periodId}`);
    revalidatePath("/rekonsiliasi/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in closePeriodAction:", error);
    return { error: error.message || "Gagal menutup periode." };
  }
}

// =============================================
// RECONCILIATION ACTIONS
// =============================================

export async function startReconciliationAction(periodId: string, assetId: string) {
  try {
    const session = await requireWriteAccess();
    const recon = await startAssetReconciliation(periodId, assetId, session.user.id);
    revalidatePath("/rekonsiliasi/pemeriksaan");
    revalidatePath(`/rekonsiliasi/periode/${periodId}`);
    return { success: true, data: { id: recon?.id } };
  } catch (error: any) {
    console.error("Error in startReconciliationAction:", error);
    return { error: error.message || "Gagal memulai rekonsiliasi aset." };
  }
}

export async function saveReconciliationAction(
  reconId: string,
  checklistData: ChecklistData[],
  notes: string
) {
  try {
    const session = await requireWriteAccess();
    const recon = await saveAssetReconciliation(reconId, checklistData, notes, session.user.id);
    revalidatePath(`/rekonsiliasi/pemeriksaan/${reconId}`);
    revalidatePath("/rekonsiliasi/dashboard");
    revalidatePath(`/assets/${recon.assetId}`);
    return { success: true, status: recon.status };
  } catch (error: any) {
    console.error("Error in saveReconciliationAction:", error);
    return { error: error.message || "Gagal menyimpan hasil rekonsiliasi." };
  }
}

export async function addFindingAction(reconId: string, data: CreateFindingInput) {
  try {
    const session = await requireWriteAccess();
    const finding = await addFinding(reconId, data, session.user.id);
    revalidatePath(`/rekonsiliasi/pemeriksaan/${reconId}`);
    revalidatePath("/rekonsiliasi/temuan");
    revalidatePath("/rekonsiliasi/dashboard");
    return { success: true, data: { id: finding.id } };
  } catch (error: any) {
    console.error("Error in addFindingAction:", error);
    return { error: error.message || "Gagal menambah temuan." };
  }
}

export async function resolveFindingAction(findingId: string) {
  try {
    const session = await requireWriteAccess();
    await resolveFinding(findingId, session.user.id);
    revalidatePath("/rekonsiliasi/temuan");
    revalidatePath("/rekonsiliasi/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in resolveFindingAction:", error);
    return { error: error.message || "Gagal menandai temuan sebagai selesai." };
  }
}
