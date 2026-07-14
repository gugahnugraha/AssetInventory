"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { updateKib } from "@/services/kib";

// Guard to check if current user is an Administrator
async function requireAdminAccess() {
  const session = await auth();
  if (!session) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    throw new Error("Akses ditolak. Hanya Administrator yang dapat mengelola data master KIB.");
  }
  return session;
}

export async function updateKibAction(
  id: string,
  data: {
    deskripsi?: string;
    isActive?: boolean;
  }
) {
  try {
    await requireAdminAccess();
    const updated = await updateKib(id, data);
    revalidatePath("/kib");
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true, kib: updated };
  } catch (error: any) {
    console.error("Error in updateKibAction:", error);
    return { error: error.message || "Gagal memperbarui data KIB." };
  }
}
