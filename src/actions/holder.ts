"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createHolder, updateHolder, deleteHolder, CreateHolderInput } from "@/services/holder";
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

export async function createHolderAction(data: CreateHolderInput) {
  try {
    await requireWriteAccess();
    
    if (!data.nama.trim() || !data.nip.trim() || !data.jabatan.trim() || !data.distributionId) {
      return { error: "Semua data pemegang barang wajib diisi." };
    }

    const newHolder = await createHolder({
      nama: data.nama.trim(),
      nip: data.nip.trim(),
      jabatan: data.jabatan.trim(),
      distributionId: data.distributionId,
    });

    revalidatePath("/pemegang");
    return { success: true, holder: newHolder };
  } catch (error: any) {
    console.error("Error in createHolderAction:", error);
    return { error: error.message || "Gagal menambahkan pemegang barang baru" };
  }
}

export async function updateHolderAction(id: string, data: Partial<CreateHolderInput>) {
  try {
    await requireWriteAccess();

    const cleanData: Partial<CreateHolderInput> = {};
    if (data.nama !== undefined) cleanData.nama = data.nama.trim();
    if (data.nip !== undefined) cleanData.nip = data.nip.trim();
    if (data.jabatan !== undefined) cleanData.jabatan = data.jabatan.trim();
    if (data.distributionId !== undefined) cleanData.distributionId = data.distributionId;

    const updatedHolder = await updateHolder(id, cleanData);
    revalidatePath("/pemegang");
    return { success: true, holder: updatedHolder };
  } catch (error: any) {
    console.error("Error in updateHolderAction:", error);
    return { error: error.message || "Gagal memperbarui data pemegang barang" };
  }
}

export async function deleteHolderAction(id: string) {
  try {
    await requireWriteAccess();
    await deleteHolder(id);
    revalidatePath("/pemegang");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteHolderAction:", error);
    return { error: error.message || "Gagal menghapus pemegang barang" };
  }
}
