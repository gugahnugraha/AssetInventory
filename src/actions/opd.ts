"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import prisma from "@/services/db";
import { Role } from "@prisma/client";

export async function updateOpdAction(id: string, name: string, code: string, numericCode?: string) {
  const session = await auth();
  if (!session) {
    return { error: "Anda harus masuk terlebih dahulu." };
  }
  if (session.user.role === Role.DEMO) {
    return { error: "Demo Only: Anda tidak diizinkan melakukan perubahan." };
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat merubah pengaturan instansi." };
  }

  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  const cleanNumericCode = numericCode ? numericCode.trim() : "";

  if (!cleanName || !cleanCode) {
    return { error: "Nama dan kode instansi wajib diisi." };
  }

  try {
    const updated = await prisma.opd.update({
      where: { id },
      data: {
        nama: cleanName,
        kode: cleanCode,
        kodeNumeric: cleanNumericCode || null,
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return { success: true, opd: updated };
  } catch (error: any) {
    console.error("Error in updateOpdAction:", error);
    return { error: error.message || "Gagal memperbarui data instansi." };
  }
}
