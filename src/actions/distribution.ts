"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createDistribution, updateDistribution, deleteDistribution } from "@/services/distribution";
import { Role } from "@prisma/client";

// Guard to check if current user has write access (Admin or Operator)
async function requireWriteAccess() {
  const session = await auth();
  if (!session) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  if (session.user.role === Role.MANAGER) {
    throw new Error("Akses ditolak. Pengguna dengan hak akses Manager hanya dapat membaca data.");
  }
  return session;
}

export async function createDistributionAction(nama: string) {
  try {
    const session = await requireWriteAccess();
    const cleanNama = nama.trim();
    if (!cleanNama) {
      return { error: "Nama bidang tidak boleh kosong." };
    }

    const newDist = await createDistribution(cleanNama, session.user.opdId);
    revalidatePath("/distribusi");
    return { success: true, distribution: newDist };
  } catch (error: any) {
    console.error("Error in createDistributionAction:", error);
    return { error: error.message || "Gagal membuat bidang distribusi baru" };
  }
}

export async function updateDistributionAction(id: string, nama: string) {
  try {
    await requireWriteAccess();
    const cleanNama = nama.trim();
    if (!cleanNama) {
      return { error: "Nama bidang tidak boleh kosong." };
    }

    const updatedDist = await updateDistribution(id, cleanNama);
    revalidatePath("/distribusi");
    return { success: true, distribution: updatedDist };
  } catch (error: any) {
    console.error("Error in updateDistributionAction:", error);
    return { error: error.message || "Gagal memperbarui bidang distribusi" };
  }
}

export async function deleteDistributionAction(id: string) {
  try {
    await requireWriteAccess();
    await deleteDistribution(id);
    revalidatePath("/distribusi");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteDistributionAction:", error);
    return { error: error.message || "Gagal menghapus bidang distribusi" };
  }
}
